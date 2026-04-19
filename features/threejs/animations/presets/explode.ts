import * as THREE from 'three'
import type { AnimationPreset, AnimationParamsMap, AnimationTarget, AnimationOutput } from '../types'
import { ZERO_OUTPUT } from '../types'

export const explodePreset: AnimationPreset = {
  id: 'explode',

  init(target, _params) {
    if (!target.mainMesh) return
    const origGeo = target.mainMesh.geometry as THREE.BufferGeometry

    // Non-indexed so every triangle owns its vertices and can move independently
    const geo  = origGeo.toNonIndexed()
    const posA = geo.attributes.position as THREE.BufferAttribute
    const triCount = Math.floor(posA.count / 3)

    const orig      = new Float32Array(posA.array as Float32Array)
    // Per-triangle: pure radial direction and pure random direction stored separately
    // so chunkSize + scatter can be blended live in update() without re-init.
    const triRadial = new Float32Array(triCount * 3)
    const triRandom = new Float32Array(triCount * 3)

    for (let tri = 0; tri < triCount; tri++) {
      // Triangle centroid
      let cx = 0, cy = 0, cz = 0
      for (let v = 0; v < 3; v++) {
        const j = (tri * 3 + v) * 3
        cx += orig[j]; cy += orig[j + 1]; cz += orig[j + 2]
      }
      cx /= 3; cy /= 3; cz /= 3
      const len = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1

      // Radial component: straight outward from mesh centre
      triRadial[tri * 3]     = cx / len
      triRadial[tri * 3 + 1] = cy / len
      triRadial[tri * 3 + 2] = 0.4

      // Random component: chaotic scatter
      triRandom[tri * 3]     = (Math.random() - 0.5) * 2.4
      triRandom[tri * 3 + 1] = (Math.random() - 0.5) * 2.4 + 0.2
      triRandom[tri * 3 + 2] = Math.random() * 2.2 + 0.3
    }

    target.mainMesh.geometry = geo

    const ud = target.mainMesh.userData
    ud._explodeOrigGeo  = origGeo
    ud._explodeOrig     = orig
    ud._explodeRadial   = triRadial
    ud._explodeRandom   = triRandom
    ud._explodeTriCount = triCount
    ud._explodeProg     = 0
    ud._explodeDir      = 1
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

    const { spread, scatter } = params.explode
    const chunkSize = Math.max(1, Math.round(params.explode.chunkSize))
    const radial    = 1 - scatter

    const orig      = ud._explodeOrig     as Float32Array
    const triRadial = ud._explodeRadial   as Float32Array
    const triRandom = ud._explodeRandom   as Float32Array
    const triCount  = ud._explodeTriCount as number
    const posA      = (target.mainMesh.geometry as THREE.BufferGeometry)
                        .attributes.position as THREE.BufferAttribute

    for (let tri = 0; tri < triCount; tri++) {
      // All tris in the same chunk share the leader's blended velocity
      const leader = Math.floor(tri / chunkSize) * chunkSize
      const l = leader * 3
      const vx = triRadial[l]     * radial + triRandom[l]     * scatter
      const vy = triRadial[l + 1] * radial + triRandom[l + 1] * scatter
      const vz = triRadial[l + 2] * radial + triRandom[l + 2] * scatter

      for (let v = 0; v < 3; v++) {
        const vtx = tri * 3 + v
        const j   = vtx * 3
        posA.setXYZ(vtx,
          orig[j]     + vx * spread * eased,
          orig[j + 1] + vy * spread * eased,
          orig[j + 2] + vz * spread * eased,
        )
      }
    }
    posA.needsUpdate = true

    return ZERO_OUTPUT
  },

  cleanup(target) {
    if (!target.mainMesh) return
    const ud = target.mainMesh.userData

    const origGeo = ud._explodeOrigGeo as THREE.BufferGeometry | undefined
    if (origGeo) {
      target.mainMesh.geometry.dispose()
      target.mainMesh.geometry = origGeo
    }

    delete ud._explodeOrigGeo;  delete ud._explodeOrig
    delete ud._explodeRadial;   delete ud._explodeRandom
    delete ud._explodeTriCount; delete ud._explodeProg; delete ud._explodeDir
  },
}
