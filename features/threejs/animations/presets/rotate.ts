import type { AnimationPreset, AnimationParamsMap, AnimationTarget, AnimationOutput } from '../types'

export const rotatePreset: AnimationPreset = {
  id: 'rotate',

  init(target, _params) {
    target.meshGroup.userData._rotAcc = { x: 0, y: 0, z: 0 }
  },

  update(target, params, delta): AnimationOutput {
    const { speed, axisX, axisY, axisZ } = params.rotate
    const acc = target.meshGroup.userData._rotAcc as { x: number; y: number; z: number }
    if (axisY) acc.y += delta * speed
    if (axisX) acc.x += delta * speed * 0.4
    if (axisZ) acc.z += delta * speed * 0.25
    return {
      posOffset: { x: 0, y: 0, z: 0 },
      rotOffset: { x: acc.x, y: acc.y, z: acc.z },
      scaleMult: 1,
    }
  },

  cleanup(target) {
    delete target.meshGroup.userData._rotAcc
  },
}
