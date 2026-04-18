import { defineStore } from 'pinia'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface SceneState {
  position: Vec3
  rotation: Vec3
  scale: number
  metalness: number
  roughness: number
  opacity: number
  wireframe: boolean
  ambientIntensity: number
  directionalIntensity: number
  lightPosition: Vec3
  fov: number
  cameraPosition: Vec3
}

const defaultState = (): SceneState => ({
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: 1,
  metalness: 0.1,
  roughness: 0.7,
  opacity: 1,
  wireframe: false,
  ambientIntensity: 0.6,
  directionalIntensity: 1.2,
  lightPosition: { x: 5, y: 8, z: 5 },
  fov: 75,
  cameraPosition: { x: 0, y: 0, z: 5 }
})

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
    setPosition(axis: keyof Vec3, value: number) {
      this.position[axis] = value
    },

    setRotation(axis: keyof Vec3, value: number) {
      this.rotation[axis] = value
    },

    setScale(value: number) {
      this.scale = value
    },

    setMetalness(value: number) {
      this.metalness = Math.max(0, Math.min(1, value))
    },

    setRoughness(value: number) {
      this.roughness = Math.max(0, Math.min(1, value))
    },

    setOpacity(value: number) {
      this.opacity = Math.max(0, Math.min(1, value))
    },

    setWireframe(value: boolean) {
      this.wireframe = value
    },

    setAmbientIntensity(value: number) {
      this.ambientIntensity = Math.max(0, Math.min(2, value))
    },

    setDirectionalIntensity(value: number) {
      this.directionalIntensity = Math.max(0, Math.min(3, value))
    },

    setLightPosition(axis: keyof Vec3, value: number) {
      this.lightPosition[axis] = value
    },

    setFov(value: number) {
      this.fov = Math.max(30, Math.min(120, value))
    },

    setCameraPosition(pos: Vec3) {
      this.cameraPosition = { ...pos }
    },

    resetScene() {
      const defaults = defaultState()
      this.position = defaults.position
      this.rotation = defaults.rotation
      this.scale = defaults.scale
      this.metalness = defaults.metalness
      this.roughness = defaults.roughness
      this.opacity = defaults.opacity
      this.wireframe = defaults.wireframe
      this.ambientIntensity = defaults.ambientIntensity
      this.directionalIntensity = defaults.directionalIntensity
      this.lightPosition = defaults.lightPosition
      this.fov = defaults.fov
      this.cameraPosition = defaults.cameraPosition
    }
  }
})
