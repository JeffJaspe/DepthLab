import * as THREE from 'three'
import type { AnimationPreset, AnimationParamsMap, AnimationTarget, AnimationOutput } from '../types'
import { ZERO_OUTPUT } from '../types'

export const glowPreset: AnimationPreset = {
  id: 'glow',

  init(target, _params) {
    if (!target.mainMesh) return
    const mats = (Array.isArray(target.mainMesh.material)
      ? target.mainMesh.material
      : [target.mainMesh.material]) as THREE.Material[]
    target.mainMesh.userData._glowOrig = mats.map(m => ({
      emissive:  (m as THREE.MeshPhysicalMaterial).emissive?.clone() ?? new THREE.Color(0),
      intensity: (m as THREE.MeshPhysicalMaterial).emissiveIntensity ?? 0,
    }))
  },

  update(target, params, _delta, time): AnimationOutput {
    if (!target.mainMesh) return ZERO_OUTPUT
    const { color, intensity, speed } = params.glow
    const pulse = Math.sin(time * speed * 2.2) * 0.5 + 0.5
    const ei    = pulse * intensity * 0.8

    const mats = (Array.isArray(target.mainMesh.material)
      ? target.mainMesh.material
      : [target.mainMesh.material]) as THREE.Material[]
    for (const m of mats) {
      const pm = m as THREE.MeshPhysicalMaterial
      if (!pm.emissive) continue
      pm.emissive.set(color)
      pm.emissiveIntensity = ei
    }
    return ZERO_OUTPUT
  },

  cleanup(target) {
    if (!target.mainMesh) return
    const orig = target.mainMesh.userData._glowOrig as
      Array<{ emissive: THREE.Color; intensity: number }> | undefined
    if (!orig) return
    const mats = (Array.isArray(target.mainMesh.material)
      ? target.mainMesh.material
      : [target.mainMesh.material]) as THREE.Material[]
    mats.forEach((m, i) => {
      const pm = m as THREE.MeshPhysicalMaterial
      if (!pm.emissive) return
      pm.emissive.copy(orig[i].emissive)
      pm.emissiveIntensity = orig[i].intensity
    })
    delete target.mainMesh.userData._glowOrig
  },
}
