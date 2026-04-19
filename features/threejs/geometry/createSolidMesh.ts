import * as THREE from 'three'

export interface SolidMeshParams {
  metalness?: number
  roughness?: number
  opacity?: number
  wireframe?: boolean
  colorTint?: string
  reflectivity?: number
}

// BoxGeometry material slot indices (Three.js order: right, left, top, bottom, front, back)
export const MAT_RIGHT  = 0
export const MAT_LEFT   = 1
export const MAT_TOP    = 2
export const MAT_BOTTOM = 3
export const MAT_FRONT  = 4
export const MAT_BACK   = 5

/**
 * Sample a thin strip from each edge of the source image and return CanvasTextures.
 * Each side texture is 1 px in the "depth" direction and full-resolution in the other,
 * so Three.js stretches it across the side face — reproducing edge colors and alpha.
 */
function buildEdgeTextures(texture: THREE.Texture): {
  right: THREE.CanvasTexture
  left:  THREE.CanvasTexture
  top:   THREE.CanvasTexture
  bottom: THREE.CanvasTexture
} {
  const img = texture.image as HTMLImageElement | HTMLCanvasElement
  const W = img.width
  const H = img.height

  // Sample a small % of the smaller dimension so we average anti-aliased fringe pixels
  const px = Math.max(2, Math.round(Math.min(W, H) * 0.015))

  const src = document.createElement('canvas')
  src.width = W
  src.height = H
  src.getContext('2d')!.drawImage(img, 0, 0)

  const slice = (sx: number, sy: number, sw: number, sh: number, ow: number, oh: number): THREE.CanvasTexture => {
    const c = document.createElement('canvas')
    c.width  = ow
    c.height = oh
    c.getContext('2d')!.drawImage(src, sx, sy, sw, sh, 0, 0, ow, oh)
    const t = new THREE.CanvasTexture(c)
    t.needsUpdate = true
    return t
  }

  return {
    right:  slice(W - px, 0,      px, H,  1, H),
    left:   slice(0,      0,      px, H,  1, H),
    top:    slice(0,      0,      W,  px, W, 1),
    bottom: slice(0,      H - px, W,  px, W, 1)
  }
}

function makeSideMat(edgeTex: THREE.CanvasTexture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: edgeTex,
    // Multiply edge color by a very dark tone so sides are clearly darker than
    // the front face — this contrast is what makes depth readable at any angle.
    color: new THREE.Color(0x181820),
    alphaTest: 0.1,
    transparent: true,
    roughness: 0.95,
    metalness: 0.0
  })
}

export function makeFrontMat(
  texture: THREE.Texture,
  p: SolidMeshParams
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    metalness: p.metalness ?? 0.1,
    roughness: p.roughness ?? 0.7,
    transparent: true,
    alphaTest: 0.05,
    opacity: p.opacity ?? 1,
    side: THREE.FrontSide,
    color: new THREE.Color(p.colorTint ?? '#ffffff'),
    reflectivity: p.reflectivity ?? 0,
    clearcoat: (p.reflectivity ?? 0) * 0.5
  })
}

/**
 * Build a BoxGeometry mesh that looks like a solid extruded object:
 *  - front  (+z face) : full texture, all material params applied
 *  - back   (-z face) : same texture darkened (depth = back of product)
 *  - sides (4 faces)  : edge pixel columns/rows from the texture, alpha-clipped
 *
 * Caller is responsible for disposing the returned mesh's geometry and materials,
 * including the CanvasTextures stored in each side material's .map.
 *
 * Material layout follows BoxGeometry convention:
 *   [0] right(+x)  [1] left(-x)  [2] top(+y)  [3] bottom(-y)
 *   [4] front(+z)  [5] back(-z)
 */
export function createSolidFromImage(
  texture: THREE.Texture,
  width: number,
  height: number,
  depth: number,
  params: SolidMeshParams = {}
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(width, height, depth)
  const edges = buildEdgeTextures(texture)

  const materials: THREE.Material[] = [
    makeSideMat(edges.right),   // 0 right  (+x)
    makeSideMat(edges.left),    // 1 left   (-x)
    makeSideMat(edges.top),     // 2 top    (+y)
    makeSideMat(edges.bottom),  // 3 bottom (-y)
    makeFrontMat(texture, params), // 4 front (+z)
    // Back face: BoxGeometry -z face normals point outward (-z), so FrontSide
    // is correct here — it renders when the camera is on the -z side (behind object).
    new THREE.MeshStandardMaterial({
      map: texture,
      alphaTest: 0.05,
      transparent: true,
      color: new THREE.Color(0x1a1a24),
      roughness: 0.9
    })
  ]

  const mesh = new THREE.Mesh(geo, materials)
  mesh.castShadow    = true
  mesh.receiveShadow = true
  return mesh
}
