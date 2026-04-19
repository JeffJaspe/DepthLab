export interface AnimationTarget {
  meshGroup: import('three').Group
  mainMesh:  import('three').Mesh | null
  scene:     import('three').Scene
}

export interface AnimationOutput {
  posOffset: { x: number; y: number; z: number }
  rotOffset: { x: number; y: number; z: number }
  scaleMult: number
}

export const ZERO_OUTPUT: AnimationOutput = {
  posOffset: { x: 0, y: 0, z: 0 },
  rotOffset: { x: 0, y: 0, z: 0 },
  scaleMult: 1,
}

export interface FloatParams    { amplitude: number; speed: number }
export interface RotateParams   { speed: number; axisX: boolean; axisY: boolean; axisZ: boolean }
export interface DissolveParams { amount: number; edgeGlow: number; speed: number; looping: boolean }
export interface ExplodeParams  { force: number; spread: number; chunkSize: number; scatter: number }
export interface WaveParams     { frequency: number; amplitude: number }
export interface PulseParams    { intensity: number; speed: number }
export interface GlowParams     { color: string; intensity: number; speed: number }

export interface AnimationParamsMap {
  float:    FloatParams
  rotate:   RotateParams
  dissolve: DissolveParams
  explode:  ExplodeParams
  wave:     WaveParams
  pulse:    PulseParams
  glow:     GlowParams
}

export interface AnimationPreset {
  id: string
  init   (target: AnimationTarget, params: AnimationParamsMap): void
  update (target: AnimationTarget, params: AnimationParamsMap, delta: number, time: number): AnimationOutput
  cleanup(target: AnimationTarget): void
}
