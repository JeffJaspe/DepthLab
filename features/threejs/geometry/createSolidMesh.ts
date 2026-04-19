import * as THREE from 'three'

export interface SolidMeshParams {
  metalness?: number
  roughness?: number
  opacity?: number
  wireframe?: boolean
  colorTint?: string
  reflectivity?: number
}

// BoxGeometry material slot indices
export const MAT_RIGHT  = 0
export const MAT_LEFT   = 1
export const MAT_TOP    = 2
export const MAT_BOTTOM = 3
export const MAT_FRONT  = 4
export const MAT_BACK   = 5

export interface SilhouetteEdges {
  right:  THREE.CanvasTexture
  left:   THREE.CanvasTexture
  top:    THREE.CanvasTexture
  bottom: THREE.CanvasTexture
}

const ALPHA_THRESHOLD = 25 // alpha > ~10% = visible pixel

/**
 * Scan every row/column of the source image and find the outermost OPAQUE
 * pixel of the actual object silhouette (not the image bounding box).
 *
 * Returns four 1-pixel-strip CanvasTextures:
 *   right/left → 1 × H  (one pixel per row)
 *   top/bottom → W × 1  (one pixel per column)
 *
 * Each pixel is either the object's edge colour at full alpha (255) or
 * transparent (0).  Side-face materials use alphaTest 0.5 so they are
 * clipped exactly to the object silhouette — never the full rectangle.
 *
 * Call this ONCE per image load and cache the result; it is O(W×H) so
 * rebuilding on every thickness-slider tick would be wasteful.
 */
export function buildSilhouetteEdges(texture: THREE.Texture): SilhouetteEdges {
  const img = texture.image as HTMLImageElement | HTMLCanvasElement
  const W = img.width
  const H = img.height

  const src = document.createElement('canvas')
  src.width = W
  src.height = H
  src.getContext('2d')!.drawImage(img, 0, 0)
  const px = src.getContext('2d')!.getImageData(0, 0, W, H).data

  const rightD  = new Uint8ClampedArray(H * 4)
  const leftD   = new Uint8ClampedArray(H * 4)
  const topD    = new Uint8ClampedArray(W * 4)
  const bottomD = new Uint8ClampedArray(W * 4)

  // right: rightmost opaque pixel per row
  for (let y = 0; y < H; y++) {
    for (let x = W - 1; x >= 0; x--) {
      const i = (y * W + x) * 4
      if (px[i + 3] > ALPHA_THRESHOLD) {
        rightD[y * 4] = px[i]; rightD[y * 4 + 1] = px[i + 1]
        rightD[y * 4 + 2] = px[i + 2]; rightD[y * 4 + 3] = 255
        break
      }
    }
  }

  // left: leftmost opaque pixel per row
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      if (px[i + 3] > ALPHA_THRESHOLD) {
        leftD[y * 4] = px[i]; leftD[y * 4 + 1] = px[i + 1]
        leftD[y * 4 + 2] = px[i + 2]; leftD[y * 4 + 3] = 255
        break
      }
    }
  }

  // top: topmost opaque pixel per column
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      const i = (y * W + x) * 4
      if (px[i + 3] > ALPHA_THRESHOLD) {
        topD[x * 4] = px[i]; topD[x * 4 + 1] = px[i + 1]
        topD[x * 4 + 2] = px[i + 2]; topD[x * 4 + 3] = 255
        break
      }
    }
  }

  // bottom: bottommost opaque pixel per column
  for (let x = 0; x < W; x++) {
    for (let y = H - 1; y >= 0; y--) {
      const i = (y * W + x) * 4
      if (px[i + 3] > ALPHA_THRESHOLD) {
        bottomD[x * 4] = px[i]; bottomD[x * 4 + 1] = px[i + 1]
        bottomD[x * 4 + 2] = px[i + 2]; bottomD[x * 4 + 3] = 255
        break
      }
    }
  }

  const mkTex = (data: Uint8ClampedArray, w: number, h: number): THREE.CanvasTexture => {
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    c.getContext('2d')!.putImageData(new ImageData(data, w, h), 0, 0)
    const t = new THREE.CanvasTexture(c)
    t.needsUpdate = true
    return t
  }

  return {
    right:  mkTex(rightD,  1, H),
    left:   mkTex(leftD,   1, H),
    top:    mkTex(topD,    W, 1),
    bottom: mkTex(bottomD, W, 1)
  }
}

export function disposeSilhouetteEdges(e: SilhouetteEdges): void {
  e.right.dispose(); e.left.dispose(); e.top.dispose(); e.bottom.dispose()
}

function makeSideMat(edgeTex: THREE.CanvasTexture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: edgeTex,
    // Darken edge colours — the dark band at the silhouette is what makes
    // the depth visible, especially from a slight angle.
    color: new THREE.Color(0x1c1c28),
    alphaTest: 0.5,  // firm cut: edge pixels are 0 or 255, no in-between
    transparent: true,
    roughness: 0.9,
    metalness: 0.05
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
 * Build a BoxGeometry mesh with:
 *   front  (+z): full texture + material params
 *   back   (-z): same texture, darkened
 *   sides  (4) : silhouette-edge colours, alpha-clipped to object shape
 *
 * Pass pre-built `edges` (from buildSilhouetteEdges) to avoid re-scanning
 * pixels on every thickness change.  If omitted, edges are built inline.
 *
 * Material layout: [right(0), left(1), top(2), bottom(3), front(4), back(5)]
 */
export function createSolidFromImage(
  texture: THREE.Texture,
  width: number,
  height: number,
  depth: number,
  params: SolidMeshParams = {},
  edges?: SilhouetteEdges
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(width, height, depth)
  const e = edges ?? buildSilhouetteEdges(texture)

  const materials: THREE.Material[] = [
    makeSideMat(e.right),
    makeSideMat(e.left),
    makeSideMat(e.top),
    makeSideMat(e.bottom),
    makeFrontMat(texture, params),
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
