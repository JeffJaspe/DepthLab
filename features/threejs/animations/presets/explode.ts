import * as THREE from 'three'
import type { AnimationPreset, AnimationParamsMap, AnimationTarget, AnimationOutput } from '../types'
import { ZERO_OUTPUT } from '../types'

// Triangles grouped into one flying chunk
const TRIS_PER_CHUNK = 4

export const explodePreset: AnimationPreset = {
  id: 'explode',

  init(target, _params) {
    if (!target.mainMesh) return
    const origGeo = target.mainMesh.geometry as THREE.BufferGeometry

    // Non-indexed so every triangle has independent vertices we can move freely
    const geo = origGeo.toNonIndexed()
    const posA = geo.attributes.position as THREE.BufferAttribute
    const triCount = Math.floor(posA.count / 3)

    const orig = new Float32Array(posA.array as Float32Array)
    const vels = new Float32Array(posA.count * 3)

    for (let tri = 0; tri < triCount; tri += TRIS_PER_CHUNK) {
      const end = Math.min(tri + TRIS_PER_CHUNK, triCount)

      // Chunk centroid
      let cx = 0, cy = 0, cz = 0
      let n = 0
      for (let t = tri; t < end; t++) {
        for (let v = 0; v < 3; v++) {
          const i = (t * 3 + v) * 3
          cx += orig[i]; cy += orig[i + 1]; cz += orig[i + 2]
          n++
        }
      }
      cx /= n; cy /= n; cz /= n

      // Outward velocity from centroid + random scatter
      const len = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1
      const vx = cx / len + (Math.random() - 0.5) * 2.0
      const vy = cy / len + (Math.random() - 0.5) * 2.0 + 0.2
      const vz = Math.random() * 2.0 + 0.3

      // All vertices in chunk share the same velocity (chunk moves as one piece)
      for (let t = tri; t < end; t++) {
        for (let v = 0; v < 3; v++) {
          const i = (t * 3 + v) * 3
          vels[i] = vx; vels[i + 1] = vy; vels[i + 2] = vz
        }
      }
    }

    target.mainMesh.geometry = geo

    const ud = target.mainMesh.userData
    ud._explodeOrigGeo = origGeo
    ud._explodeOrig    = orig
    ud._explodeVels    = vels
    ud._explodeProg    = 0
    ud._explodeDir     = 1
  },

  update(target, params, delta): AnimationOutput {
    if (!target.mainMesh) return ZERO_OUTPUT
    const ud = target.mainMesh.userData
    if (!ud._explodeOrig) return ZERO_OUTPUT

    let prog = (ud._explodeProg as number) ?? 0
    let dir  = (ud._explodeDir  as number) ?? 1

    prog += delta * 0.5 * dir * params.explode.force
    if (prog >= 1) { prog = 1; dir = -1 }
    else if (prog <= 0) { prog = 0; dir = 1 }
    ud._explodeProg = prog
    ud._explodeDir  = dir

    const eased = prog < 0.5
      ? 4 * prog * prog * prog
      : 1 - Math.pow(-2 * prog + 2, 3) / 2

    const spread = params.explode.spread
    const orig   = ud._explodeOrig as Float32Array
    const vels   = ud._explodeVels as Float32Array
    const posA   = (target.mainMesh.geometry as THREE.BufferGeometry)
                     .attributes.position as THREE.BufferAttribute

    for (let i = 0; i < posA.count; i++) {
      const j = i * 3
      posA.setXYZ(i,
        orig[j]     + vels[j]     * spread * eased,
        orig[j + 1] + vels[j + 1] * spread * eased,
        orig[j + 2] + vels[j + 2] * spread * eased,
      )
    }
    posA.needsUpdate = true

    return ZERO_OUTPUT
  },

  cleanup(target) {
    if (!target.mainMesh) return
    const ud = target.mainMesh.userData

    // Restore original indexed geometry and dispose the non-indexed copy
    const origGeo = ud._explodeOrigGeo as THREE.BufferGeometry | undefined
    if (origGeo) {
      target.mainMesh.geometry.dispose()
      target.mainMesh.geometry = origGeo
    }

    delete ud._explodeOrigGeo; delete ud._explodeOrig
    delete ud._explodeVels;    delete ud._explodeProg; delete ud._explodeDir
  },
}
