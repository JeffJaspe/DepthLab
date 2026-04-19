import type { AnimationTarget, AnimationParamsMap, AnimationOutput, AnimationPreset } from './types'
import { floatPreset }   from './presets/float'
import { rotatePreset }  from './presets/rotate'
import { dissolvePreset } from './presets/dissolve'
import { explodePreset } from './presets/explode'
import { wavePreset }    from './presets/wave'
import { pulsePreset }   from './presets/pulse'
import { glowPreset }    from './presets/glow'

const REGISTRY: Record<string, AnimationPreset> = {
  float:    floatPreset,
  rotate:   rotatePreset,
  dissolve: dissolvePreset,
  explode:  explodePreset,
  wave:     wavePreset,
  pulse:    pulsePreset,
  glow:     glowPreset,
}

const ZERO: AnimationOutput = {
  posOffset: { x: 0, y: 0, z: 0 },
  rotOffset: { x: 0, y: 0, z: 0 },
  scaleMult: 1,
}

export class AnimationController {
  private active: AnimationPreset | null = null
  private activeId = 'none'
  private target: AnimationTarget
  private lastParams: AnimationParamsMap | null = null

  constructor(target: AnimationTarget) {
    this.target = target
  }

  /** Switch to a new preset, cleaning up the previous one. */
  setPreset(id: string, params: AnimationParamsMap): void {
    if (id === this.activeId) return
    this.active?.cleanup(this.target)
    this.active   = null
    this.activeId = id
    this.lastParams = params
    if (id !== 'none' && REGISTRY[id]) {
      this.active = REGISTRY[id]
      this.active.init(this.target, params)
    }
  }

  /** Called every animation frame. */
  update(params: AnimationParamsMap, delta: number, time: number): AnimationOutput {
    this.lastParams = params
    if (!this.active) return ZERO
    return this.active.update(this.target, params, delta, time)
  }

  /** Call BEFORE disposing the old mesh (cleanup uses the old target). */
  cleanupForRebuild(): void {
    this.active?.cleanup(this.target)
  }

  /** Call AFTER the new mesh is built to re-init with the updated target. */
  onMeshChanged(target: AnimationTarget): void {
    this.target = target
    if (this.active && this.activeId !== 'none' && this.lastParams) {
      this.active.init(target, this.lastParams)
    }
  }

  cleanup(): void {
    this.active?.cleanup(this.target)
    this.active   = null
    this.activeId = 'none'
  }

  getActiveId(): string { return this.activeId }
}
