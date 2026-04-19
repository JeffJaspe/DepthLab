import * as THREE from 'three'

export interface SolidMeshParams {
  metalness?: number
  roughness?: number
  opacity?: number
  wireframe?: boolean
  colorTint?: string
  reflectivity?: number
}

// ExtrudeGeometry material groups: 0 = side walls, 1 = front + back caps
export const MAT_SIDES = 0
export const MAT_FRONT = 1   // getFrontMat() targets this group

const ALPHA_THRESHOLD = 25   // alpha > ~10% = opaque

/**
 * Scan the source image and return the object's left/right silhouette boundary
 * as a closed polygon in normalised [0,1] image coordinates.
 *
 * Strategy: for each sample row find the leftmost and rightmost opaque pixel of
 * the actual object — NOT the image bounding box.  The polygon is:
 *   right edge (top→bottom) + left edge reversed (bottom→top)
 *
 * This is O(W×H) and should be called once per image load, then cached.
 */
export function traceSilhouettePath(texture: THREE.Texture): Array<[number, number]> | null {
  const img = texture.image as HTMLImageElement | HTMLCanvasElement
  const W = img.width
  const H = img.height
  if (!W || !H) return null

  const cvs = document.createElement('canvas')
  cvs.width = W; cvs.height = H
  cvs.getContext('2d')!.drawImage(img, 0, 0)
  const px = cvs.getContext('2d')!.getImageData(0, 0, W, H).data

  // ~200 samples per side — fine enough for most product images
  const step = Math.max(1, Math.floor(H / 200))

  const right: Array<[number, number]> = []
  const left:  Array<[number, number]> = []

  for (let y = 0; y < H; y += step) {
    let xR = -1, xL = -1
    for (let x = W - 1; x >= 0; x--) {
      if (px[(y * W + x) * 4 + 3] > ALPHA_THRESHOLD) { xR = x; break }
    }
    for (let x = 0; x < W; x++) {
      if (px[(y * W + x) * 4 + 3] > ALPHA_THRESHOLD) { xL = x; break }
    }
    if (xR < 0) continue           // fully transparent row — skip
    right.push([xR / (W - 1), y / (H - 1)])
    left.push( [xL / (W - 1), y / (H - 1)])
  }

  if (right.length < 3) return null   // no visible object

  // Closed polygon: right edge (top→bottom), then left edge reversed (bottom→top)
  return [...right, ...[...left].reverse()]
}

/** Convert normalised image [0,1]×[0,1] coords to Three.js world space. */
function toWorld(
  path: Array<[number, number]>,
  width: number,
  height: number
): Array<[number, number]> {
  return path.map(([u, v]) => [
    u * width  - width  / 2,    // x:  0→1  →  -w/2→+w/2
    -(v * height - height / 2)  // y: flip  →  +h/2→-h/2  (image top = Three.js top)
  ])
}

export function makeFrontMat(
  texture: THREE.Texture,
  p: SolidMeshParams
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    metalness:   p.metalness   ?? 0.1,
    roughness:   p.roughness   ?? 0.7,
    transparent: true,
    alphaTest:   0.05,
    opacity:     p.opacity     ?? 1,
    side:        THREE.DoubleSide,
    color:       new THREE.Color(p.colorTint ?? '#ffffff'),
    reflectivity: p.reflectivity ?? 0,
    clearcoat:   (p.reflectivity ?? 0) * 0.5
  })
}

function makeFlatFallback(
  texture: THREE.Texture,
  width: number,
  height: number,
  params: SolidMeshParams
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    makeFrontMat(texture, params)
  )
  mesh.castShadow = mesh.receiveShadow = true
  return mesh
}

/**
 * Build an extruded mesh whose shape follows the object's alpha silhouette:
 *
 *  group 0 — side walls : solid dark material, no texture
 *  group 1 — cap faces  : full texture + alphaTest, DoubleSide
 *              (front cap is lit; back cap is naturally dark via lighting)
 *
 * The custom uvGenerator maps cap faces from world XY → [0,1] texture UV so
 * the image aligns correctly regardless of where the object sits in the frame.
 *
 * Pass pre-traced `cachedPath` (from traceSilhouettePath) to skip the pixel
 * scan on every thickness-slider rebuild.
 */
export function createSolidFromImage(
  texture: THREE.Texture,
  width: number,
  height: number,
  depth: number,
  params: SolidMeshParams = {},
  cachedPath?: Array<[number, number]> | null
): THREE.Mesh {
  const normPath = cachedPath ?? traceSilhouettePath(texture)
  if (!normPath || normPath.length < 6) {
    return makeFlatFallback(texture, width, height, params)
  }

  const worldPath = toWorld(normPath, width, height)
  const halfW = width / 2
  const halfH = height / 2

  // UV generator: cap faces map world XY → [0,1] texture space
  const uvGenerator = {
    generateTopUV(_: unknown, v: number[], a: number, b: number, c: number) {
      return [
        new THREE.Vector2((v[a * 3]     + halfW) / width,  (v[a * 3 + 1] + halfH) / height),
        new THREE.Vector2((v[b * 3]     + halfW) / width,  (v[b * 3 + 1] + halfH) / height),
        new THREE.Vector2((v[c * 3]     + halfW) / width,  (v[c * 3 + 1] + halfH) / height),
      ]
    },
    generateSideWallUV(_: unknown, _v: number[], _a: number, _b: number, _c: number, _d: number) {
      return [
        new THREE.Vector2(0, 0), new THREE.Vector2(1, 0),
        new THREE.Vector2(1, 1), new THREE.Vector2(0, 1),
      ]
    }
  }

  // Build Three.js Shape from the world-space silhouette path
  const shape = new THREE.Shape()
  shape.moveTo(worldPath[0][0], worldPath[0][1])
  for (let i = 1; i < worldPath.length; i++) shape.lineTo(worldPath[i][0], worldPath[i][1])
  shape.closePath()

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    steps: 1,
    uvGenerator
  })
  geo.translate(0, 0, -depth / 2)   // centre extrusion around z=0

  // Side walls: dark, flat colour — the depth band
  const sideMat = new THREE.MeshStandardMaterial({
    color:    new THREE.Color(0x1c1c28),
    roughness: 0.9,
    metalness: 0.05
  })

  // Cap faces: the actual image, DoubleSide so both front and back render
  const capMat = makeFrontMat(texture, params)

  const mesh = new THREE.Mesh(geo, [sideMat, capMat])
  mesh.castShadow = mesh.receiveShadow = true
  return mesh
}
