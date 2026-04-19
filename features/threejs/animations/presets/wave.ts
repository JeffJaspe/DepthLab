import * as THREE from 'three'
import type { AnimationPreset, AnimationParamsMap, AnimationTarget, AnimationOutput } from '../types'
import { ZERO_OUTPUT } from '../types'

export const wavePreset: AnimationPreset = {
  id: 'wave',

  init(target, _params) {
    if (!target.mainMesh) return
    const pos = target.mainMesh.geometry.attributes.position as THREE.BufferAttribute
    target.mainMesh.geometry.userData._waveOrig = pos.array.slice() as Float32Array
  },

  update(target, params, _delta, time): AnimationOutput {
    if (!target.mainMesh) return ZERO_OUTPUT
    const { frequency, amplitude } = params.wave
    const geo  = target.mainMesh.geometry as THREE.BufferGeometry
    const pos  = geo.attributes.position as THREE.BufferAttribute
    const orig = geo.userData._waveOrig as Float32Array | undefined
    if (!orig) return ZERO_OUTPUT

    const amp = amplitude * 0.1
    for (let i = 0; i < pos.count; i++) {
      const x = orig[i * 3]
      const z = orig[i * 3 + 2]
      pos.setY(i,
        orig[i * 3 + 1]
        + Math.sin(x * frequency + time * 2.6) * Math.cos(z * 0.9 + time * 1.3) * amp
      )
    }
    pos.needsUpdate = true
    return ZERO_OUTPUT
  },

  cleanup(target) {
    if (!target.mainMesh) return
    const geo  = target.mainMesh.geometry as THREE.BufferGeometry
    const pos  = geo.attributes.position as THREE.BufferAttribute
    const orig = geo.userData._waveOrig as Float32Array | undefined
    if (orig) {
      for (let i = 0; i < pos.count; i++) {
        pos.setXYZ(i, orig[i * 3], orig[i * 3 + 1], orig[i * 3 + 2])
      }
      pos.needsUpdate = true
    }
    delete geo.userData._waveOrig
  },
}
