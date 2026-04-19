import { defineStore } from 'pinia'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface SceneState {
  // Transform
  position: Vec3
  rotation: Vec3
  scale: number
  // Base material
  metalness: number
  roughness: number
  opacity: number
  wireframe: boolean
  // Extended material
  colorTint: string
  materialPreset: string
  reflectivity: number
  // Depth / Geometry
  thickness: number
  // Stroke / Outline
  outlineEnabled: boolean
  outlineColor: string
  outlineThickness: number
  // Lighting
  ambientIntensity: number
  directionalIntensity: number
  lightPosition: Vec3
  // Camera
  fov: number
  cameraPosition: Vec3
  // Animation
  autoRotate: boolean
  autoRotateSpeed: number
  floatEnabled: boolean
  floatIntensity: number
  hoverEnabled: boolean
  // Effects
  fireEnabled: boolean
  fireIntensity: number
  waterEnabled: boolean
  waterIntensity: number
  windEnabled: boolean
  windIntensity: number
  // Scene
  bgColor: string
  // Animation presets
  animationPreset: string
  animationEnabled: boolean
  animFloat:    { amplitude: number; speed: number }
  animRotate:   { speed: number; axisX: boolean; axisY: boolean; axisZ: boolean }
  animDissolve: { amount: number; edgeGlow: number; speed: number; looping: boolean }
  animExplode:  { force: number; spread: number }
  animWave:     { frequency: number; amplitude: number }
  animPulse:    { intensity: number; speed: number }
  animGlow:     { color: string; intensity: number; speed: number }
}

const defaultState = (): SceneState => ({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
  metalness: 0.1,
  roughness: 0.7,
  opacity: 1,
  wireframe: false,
  colorTint: '#ffffff',
  materialPreset: 'custom',
  reflectivity: 0,
  thickness: 0.35,
  outlineEnabled: false,
  outlineColor: '#ffffff',
  outlineThickness: 0.04,
  ambientIntensity: 0.6,
  directionalIntensity: 1.2,
  lightPosition: { x: 5, y: 8, z: 5 },
  fov: 75,
  cameraPosition: { x: 0, y: 0, z: 5 },
  autoRotate: false,
  autoRotateSpeed: 0.5,
  floatEnabled: false,
  floatIntensity: 0.5,
  hoverEnabled: false,
  fireEnabled: false,
  fireIntensity: 0.5,
  waterEnabled: false,
  waterIntensity: 0.5,
  windEnabled: false,
  windIntensity: 0.5,
  bgColor: '#0A0A0F',
  animationPreset: 'none',
  animationEnabled: false,
  animFloat:    { amplitude: 0.5, speed: 1.0 },
  animRotate:   { speed: 0.5, axisX: false, axisY: true, axisZ: false },
  animDissolve: { amount: 0.0, edgeGlow: 0.6, speed: 0.3, looping: true },
  animExplode:  { force: 1.0, spread: 1.5 },
  animWave:     { frequency: 2.0, amplitude: 0.4 },
  animPulse:    { intensity: 0.15, speed: 1.0 },
  animGlow:     { color: '#6C63FF', intensity: 0.5, speed: 1.0 },
})

const MATERIAL_PRESETS: Record<string, Partial<SceneState>> = {
  plastic: { metalness: 0.0,  roughness: 0.45, reflectivity: 0.3  },
  metal:   { metalness: 0.95, roughness: 0.12, reflectivity: 0.85 },
  glass:   { metalness: 0.0,  roughness: 0.0,  reflectivity: 0.95, opacity: 0.72 },
  matte:   { metalness: 0.0,  roughness: 0.95, reflectivity: 0.0  },
  glossy:  { metalness: 0.05, roughness: 0.04, reflectivity: 0.65 }
}

export const useSceneStore = defineStore('scene', {
  state: defaultState,

  getters: {
    rotationDegrees: (state) => ({
      x: parseFloat(((state.rotation.x * 180) / Math.PI).toFixed(1)),
      y: parseFloat(((state.rotation.y * 180) / Math.PI).toFixed(1)),
      z: parseFloat(((state.rotation.z * 180) / Math.PI).toFixed(1))
    })
  },

  actions: {
    setPosition(axis: keyof Vec3, value: number) { this.position[axis] = value },
    setRotation(axis: keyof Vec3, value: number) { this.rotation[axis] = value },
    setScale(value: number) { this.scale = value },

    setMetalness(value: number) { this.metalness = Math.max(0, Math.min(1, value)) },
    setRoughness(value: number) { this.roughness = Math.max(0, Math.min(1, value)) },
    setOpacity(value: number) { this.opacity = Math.max(0, Math.min(1, value)) },
    setWireframe(value: boolean) { this.wireframe = value },
    setColorTint(value: string) { this.colorTint = value; this.materialPreset = 'custom' },
    setReflectivity(value: number) { this.reflectivity = Math.max(0, Math.min(1, value)) },

    applyMaterialPreset(preset: string) {
      const p = MATERIAL_PRESETS[preset]
      if (!p) return
      this.materialPreset = preset
      if (p.metalness  !== undefined) this.metalness   = p.metalness
      if (p.roughness  !== undefined) this.roughness   = p.roughness
      if (p.reflectivity !== undefined) this.reflectivity = p.reflectivity
      if (p.opacity    !== undefined) this.opacity     = p.opacity
    },

    setThickness(value: number) { this.thickness = Math.max(0, Math.min(0.6, value)) },

    setOutlineEnabled(value: boolean) { this.outlineEnabled = value },
    setOutlineColor(value: string) { this.outlineColor = value },
    setOutlineThickness(value: number) { this.outlineThickness = Math.max(0.01, Math.min(0.2, value)) },

    setAmbientIntensity(value: number) { this.ambientIntensity = Math.max(0, Math.min(2, value)) },
    setDirectionalIntensity(value: number) { this.directionalIntensity = Math.max(0, Math.min(3, value)) },
    setLightPosition(axis: keyof Vec3, value: number) { this.lightPosition[axis] = value },

    setFov(value: number) { this.fov = Math.max(30, Math.min(120, value)) },
    setCameraPosition(pos: Vec3) { this.cameraPosition = { ...pos } },

    setAutoRotate(value: boolean) { this.autoRotate = value },
    setAutoRotateSpeed(value: number) { this.autoRotateSpeed = Math.max(0.1, Math.min(5, value)) },
    setFloatEnabled(value: boolean) { this.floatEnabled = value },
    setFloatIntensity(value: number) { this.floatIntensity = Math.max(0.1, Math.min(2, value)) },
    setHoverEnabled(value: boolean) { this.hoverEnabled = value },

    setFireEnabled(value: boolean) { this.fireEnabled = value },
    setFireIntensity(value: number) { this.fireIntensity = Math.max(0.1, Math.min(1, value)) },
    setWaterEnabled(value: boolean) { this.waterEnabled = value },
    setWaterIntensity(value: number) { this.waterIntensity = Math.max(0.1, Math.min(1, value)) },
    setWindEnabled(value: boolean) { this.windEnabled = value },
    setWindIntensity(value: number) { this.windIntensity = Math.max(0.1, Math.min(1, value)) },

    setBgColor(value: string) { this.bgColor = value },

    setAnimationPreset(value: string)  { this.animationPreset  = value },
    setAnimationEnabled(value: boolean) { this.animationEnabled = value },

    resetScene() {
      const d = defaultState()
      Object.assign(this, d)
    }
  }
})
