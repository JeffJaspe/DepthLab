import * as THREE from 'three'

/**
 * Factory helpers for creating re-usable Three.js materials with
 * DepthLab's design-system colours.
 */

export function createPlaneMaterial(texture?: THREE.Texture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: texture ?? null,
    metalness: 0.1,
    roughness: 0.7,
    transparent: false,
    opacity: 1,
    side: THREE.DoubleSide
  })
}

export function createWireframeMaterial(color: number = 0x6C63FF): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: 0.5
  })
}

export function createEdgeMaterial(color: number = 0x8B5CF6): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8
  })
}

export function createGridMaterial(): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color: 0x1A1A24,
    transparent: true,
    opacity: 0.4
  })
}

export function createGlowMaterial(color: number = 0x6C63FF): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.08,
    side: THREE.FrontSide
  })
}

/**
 * Creates an environment-light-style gradient sky for the background
 */
export function createGradientTexture(
  topColor: string = '#0A0A0F',
  bottomColor: string = '#111118'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 0, 512)
  gradient.addColorStop(0, topColor)
  gradient.addColorStop(1, bottomColor)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 2, 512)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/**
 * Applies material parameter updates to an existing MeshStandardMaterial
 */
export function applyMaterialParams(
  material: THREE.MeshStandardMaterial,
  params: {
    metalness?: number
    roughness?: number
    opacity?: number
    wireframe?: boolean
    color?: number
  }
): void {
  if (params.metalness !== undefined) material.metalness = params.metalness
  if (params.roughness !== undefined) material.roughness = params.roughness
  if (params.opacity !== undefined) {
    material.opacity = params.opacity
    material.transparent = params.opacity < 1
  }
  if (params.wireframe !== undefined) material.wireframe = params.wireframe
  if (params.color !== undefined) material.color.set(params.color)
  material.needsUpdate = true
}
