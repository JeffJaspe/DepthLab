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
  autoRotate: boolean
  autoRotateSpeed: number
  bgColor: string
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
  cameraPosition: { x: 0, y: 0, z: 5 },
  autoRotate: false,
  autoRotateSpeed: 0.5,
  bgColor: '#0A0A0F'
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

    setAutoRotate(value: boolean) {
      this.autoRotate = value
    },

    setAutoRotateSpeed(value: number) {
      this.autoRotateSpeed = Math.max(0.1, Math.min(5, value))
    },

    setBgColor(value: string) {
      this.bgColor = value
    },

    resetScene() {
      const d = defaultState()
      this.position = d.position
      this.rotation = d.rotation
      this.scale = d.scale
      this.metalness = d.metalness
      this.roughness = d.roughness
      this.opacity = d.opacity
      this.wireframe = d.wireframe
      this.ambientIntensity = d.ambientIntensity
      this.directionalIntensity = d.directionalIntensity
      this.lightPosition = d.lightPosition
      this.fov = d.fov
      this.cameraPosition = d.cameraPosition
      this.autoRotate = d.autoRotate
      this.autoRotateSpeed = d.autoRotateSpeed
      this.bgColor = d.bgColor
    }
  }
})
