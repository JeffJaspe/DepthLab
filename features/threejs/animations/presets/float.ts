import type { AnimationPreset, AnimationParamsMap, AnimationTarget, AnimationOutput } from '../types'

export const floatPreset: AnimationPreset = {
  id: 'float',

  init(_target, _params) {},

  update(_target, params, _delta, time): AnimationOutput {
    const { amplitude, speed } = params.float
    return {
      posOffset: { x: 0, y: Math.sin(time * speed * 1.4) * amplitude * 0.15, z: 0 },
      rotOffset: { x: Math.sin(time * speed * 0.7) * 0.012, y: 0, z: 0 },
      scaleMult: 1,
    }
  },

  cleanup(_target) {},
}
