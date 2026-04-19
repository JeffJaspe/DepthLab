import type { AnimationPreset, AnimationParamsMap, AnimationTarget, AnimationOutput } from '../types'

export const pulsePreset: AnimationPreset = {
  id: 'pulse',
  init(_t, _p) {},

  update(_target, params, _delta, time): AnimationOutput {
    const { intensity, speed } = params.pulse
    const scaleMult = 1 + Math.sin(time * speed * 2.8) * intensity * 0.18
    return {
      posOffset: { x: 0, y: 0, z: 0 },
      rotOffset: { x: 0, y: 0, z: 0 },
      scaleMult,
    }
  },

  cleanup(_t) {},
}
