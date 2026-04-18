import * as THREE from 'three'

export interface MaterialParams {
  metalness?: number
  roughness?: number
  opacity?: number
  wireframe?: boolean
}

export interface TransformParams {
  position?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  scale?: number
}

export interface LightParams {
  ambientIntensity?: number
  directionalIntensity?: number
  lightPosition?: { x: number; y: number; z: number }
}

export class ThreeScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private mesh: THREE.Mesh | null = null
  private defaultCube: THREE.Mesh | null = null
  private animationId: number = 0
  private isDragging: boolean = false
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 }
  private ambientLight: THREE.AmbientLight
  private directionalLight: THREE.DirectionalLight
  private canvas: HTMLCanvasElement
  private isDisposed: boolean = false

  // Spherical coordinate state for orbit
  private spherical: { radius: number; theta: number; phi: number } = {
    radius: 5,
    theta: 0,
    phi: Math.PI / 2
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  }

  init(): void {
    const { clientWidth, clientHeight } = this.canvas

    // Renderer setup
    this.renderer.setSize(clientWidth, clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x0A0A0F, 1)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0

    // Scene background
    this.scene.background = new THREE.Color(0x0A0A0F)

    // Lights
    this.scene.add(this.ambientLight)

    this.directionalLight.position.set(5, 8, 5)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.width = 1024
    this.directionalLight.shadow.mapSize.height = 1024
    this.directionalLight.shadow.camera.near = 0.1
    this.directionalLight.shadow.camera.far = 50
    this.scene.add(this.directionalLight)

    // Hemisphere light for ambient fill
    const hemisphereLight = new THREE.HemisphereLight(0x6C63FF, 0x0A0A0F, 0.2)
    this.scene.add(hemisphereLight)

    // Camera
    this.camera.position.set(0, 0, 5)
    this.camera.lookAt(0, 0, 0)

    // Fog (subtle depth)
    this.scene.fog = new THREE.FogExp2(0x0A0A0F, 0.05)

    // Default cube
    this.createDefaultCube()

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x1A1A24, 0x111118)
    gridHelper.position.y = -2
    gridHelper.material.opacity = 0.4
    gridHelper.material.transparent = true
    this.scene.add(gridHelper)

    // Start animation
    this.animate()
  }

  private createDefaultCube(): void {
    // Wireframe cube with accent color for the empty state
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)

    // Solid semi-transparent fill
    const material = new THREE.MeshStandardMaterial({
      color: 0x6C63FF,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    })

    this.defaultCube = new THREE.Mesh(geometry, material)

    // Wireframe overlay
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x6C63FF,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    })
    const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial)
    this.defaultCube.add(wireframeMesh)

    // Edge lines
    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x8B5CF6,
      transparent: true,
      opacity: 0.8
    })
    const edgeLines = new THREE.LineSegments(edges, lineMaterial)
    this.defaultCube.add(edgeLines)

    this.scene.add(this.defaultCube)
  }

  async loadTexture(url: string): Promise<void> {
    const loader = new THREE.TextureLoader()

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          texture.minFilter = THREE.LinearMipmapLinearFilter
          texture.magFilter = THREE.LinearFilter
          texture.generateMipmaps = true

          // Remove default cube
          if (this.defaultCube) {
            this.scene.remove(this.defaultCube)
            this.defaultCube.geometry.dispose()
            this.defaultCube = null
          }

          // Remove previous mesh
          if (this.mesh) {
            this.scene.remove(this.mesh)
            if (this.mesh.geometry) this.mesh.geometry.dispose()
            if (this.mesh.material) {
              if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach((m) => m.dispose())
              } else {
                this.mesh.material.dispose()
              }
            }
          }

          // Determine aspect ratio from texture
          const aspect = texture.image.width / texture.image.height
          const width = 3
          const height = width / aspect

          const geometry = new THREE.PlaneGeometry(width, height, 32, 32)
          const material = new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0.1,
            roughness: 0.7,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
          })

          this.mesh = new THREE.Mesh(geometry, material)
          this.mesh.receiveShadow = true
          this.mesh.castShadow = true

          // Start hidden for GSAP animation
          this.mesh.scale.setScalar(0)
          this.scene.add(this.mesh)

          resolve()
        },
        undefined,
        (error) => {
          console.error('[ThreeScene] Failed to load texture:', error)
          reject(error)
        }
      )
    })
  }

  updateMaterial(params: MaterialParams): void {
    if (!this.mesh) return
    const mat = this.mesh.material as THREE.MeshStandardMaterial

    if (params.metalness !== undefined) mat.metalness = params.metalness
    if (params.roughness !== undefined) mat.roughness = params.roughness
    if (params.opacity !== undefined) {
      mat.opacity = params.opacity
      mat.transparent = params.opacity < 1
    }
    if (params.wireframe !== undefined) mat.wireframe = params.wireframe

    mat.needsUpdate = true
  }

  updateTransform(params: TransformParams): void {
    if (!this.mesh) return

    if (params.position) {
      this.mesh.position.set(params.position.x, params.position.y, params.position.z)
    }
    if (params.rotation) {
      this.mesh.rotation.set(params.rotation.x, params.rotation.y, params.rotation.z)
    }
    if (params.scale !== undefined) {
      this.mesh.scale.setScalar(params.scale)
    }
  }

  updateLights(params: LightParams): void {
    if (params.ambientIntensity !== undefined) {
      this.ambientLight.intensity = params.ambientIntensity
    }
    if (params.directionalIntensity !== undefined) {
      this.directionalLight.intensity = params.directionalIntensity
    }
    if (params.lightPosition) {
      this.directionalLight.position.set(
        params.lightPosition.x,
        params.lightPosition.y,
        params.lightPosition.z
      )
    }
  }

  updateCamera(fov: number): void {
    this.camera.fov = fov
    this.camera.updateProjectionMatrix()
  }

  resetCamera(): void {
    this.spherical = { radius: 5, theta: 0, phi: Math.PI / 2 }
    this.updateCameraFromSpherical()
  }

  private updateCameraFromSpherical(): void {
    const { radius, theta, phi } = this.spherical
    this.camera.position.x = radius * Math.sin(phi) * Math.sin(theta)
    this.camera.position.y = radius * Math.cos(phi)
    this.camera.position.z = radius * Math.sin(phi) * Math.cos(theta)
    this.camera.lookAt(0, 0, 0)
  }

  handleMouseDown(e: MouseEvent): void {
    this.isDragging = true
    this.previousMousePosition = { x: e.clientX, y: e.clientY }
  }

  handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return

    const deltaX = e.clientX - this.previousMousePosition.x
    const deltaY = e.clientY - this.previousMousePosition.y

    const sensitivity = 0.005

    this.spherical.theta -= deltaX * sensitivity
    this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi - deltaY * sensitivity))

    this.updateCameraFromSpherical()

    this.previousMousePosition = { x: e.clientX, y: e.clientY }
  }

  handleMouseUp(): void {
    this.isDragging = false
  }

  handleWheel(e: WheelEvent): void {
    e.preventDefault()
    const zoomSpeed = 0.1
    const delta = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed
    this.spherical.radius = Math.max(1, Math.min(20, this.spherical.radius * delta))
    this.updateCameraFromSpherical()
  }

  zoomIn(): void {
    this.spherical.radius = Math.max(1, this.spherical.radius * 0.85)
    this.updateCameraFromSpherical()
  }

  zoomOut(): void {
    this.spherical.radius = Math.min(20, this.spherical.radius * 1.15)
    this.updateCameraFromSpherical()
  }

  getMesh(): THREE.Mesh | null {
    return this.mesh
  }

  getCameraPosition(): { x: number; y: number; z: number } {
    return {
      x: parseFloat(this.camera.position.x.toFixed(2)),
      y: parseFloat(this.camera.position.y.toFixed(2)),
      z: parseFloat(this.camera.position.z.toFixed(2))
    }
  }

  resize(width: number, height: number): void {
    if (this.isDisposed) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  dispose(): void {
    this.isDisposed = true
    cancelAnimationFrame(this.animationId)

    // Dispose mesh
    if (this.mesh) {
      this.scene.remove(this.mesh)
      this.mesh.geometry.dispose()
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => {
          if ((m as THREE.MeshStandardMaterial).map) {
            (m as THREE.MeshStandardMaterial).map!.dispose()
          }
          m.dispose()
        })
      } else {
        const mat = this.mesh.material as THREE.MeshStandardMaterial
        if (mat.map) mat.map.dispose()
        mat.dispose()
      }
    }

    if (this.defaultCube) {
      this.scene.remove(this.defaultCube)
      this.defaultCube.geometry.dispose()
    }

    this.renderer.dispose()
  }

  private animate(): void {
    if (this.isDisposed) return

    this.animationId = requestAnimationFrame(() => this.animate())

    // Rotate default cube
    if (this.defaultCube) {
      this.defaultCube.rotation.x += 0.003
      this.defaultCube.rotation.y += 0.005
    }

    this.renderer.render(this.scene, this.camera)
  }
}
