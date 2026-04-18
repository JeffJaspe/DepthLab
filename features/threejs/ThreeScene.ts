import * as THREE from 'three'

export interface MaterialParams {
  metalness?: number
  roughness?: number
  opacity?: number
  wireframe?: boolean
  colorTint?: string
  reflectivity?: number
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

export interface OutlineParams {
  enabled: boolean
  color: string
  thickness: number
}

export interface EffectsParams {
  fire:  { enabled: boolean; intensity: number }
  water: { enabled: boolean; intensity: number }
  wind:  { enabled: boolean; intensity: number }
  float: { enabled: boolean; intensity: number }
}

export class ThreeScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer

  // Mesh hierarchy: scene → meshGroup → mainMesh + outlineMesh
  private meshGroup: THREE.Group | null = null
  private mainMesh: THREE.Mesh | null = null
  private outlineMesh: THREE.Mesh | null = null

  // Retained for geometry rebuilds
  private currentTexture: THREE.Texture | null = null
  private textureAspect: number = 1
  private currentThickness: number = 0
  private hasLoaded: boolean = false

  // Default cube (empty state)
  private defaultCube: THREE.Mesh | null = null

  // Lights
  private ambientLight: THREE.AmbientLight
  private directionalLight: THREE.DirectionalLight
  private fireLight: THREE.PointLight
  private waterLight: THREE.PointLight

  // Stored material params (preserved across geometry rebuilds)
  private matParams: MaterialParams = {
    metalness: 0.1, roughness: 0.7, opacity: 1,
    wireframe: false, colorTint: '#ffffff', reflectivity: 0
  }
  private outlineParams: OutlineParams = { enabled: false, color: '#ffffff', thickness: 0.04 }

  // Base transform (user-set values; effects are offsets added on top)
  private basePos = new THREE.Vector3()
  private baseRot = new THREE.Euler()
  private autoRotAngle = 0
  private hoverTilt = new THREE.Vector2()
  private mouseNorm = new THREE.Vector2()

  // Effects
  private effects: EffectsParams = {
    fire:  { enabled: false, intensity: 0.5 },
    water: { enabled: false, intensity: 0.5 },
    wind:  { enabled: false, intensity: 0.5 },
    float: { enabled: false, intensity: 0.5 }
  }

  // Animation state
  private animationId: number = 0
  private isDragging = false
  private prevMouse = { x: 0, y: 0 }
  private autoRotateEnabled = false
  private autoRotateSpeed = 0.5
  private hoverEnabled = false
  private spherical = { radius: 5, theta: 0, phi: Math.PI / 2 }
  private canvas: HTMLCanvasElement
  private isDisposed = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    this.fireLight  = new THREE.PointLight(0xFF5520, 0, 10)
    this.waterLight = new THREE.PointLight(0x3090FF, 0, 10)
  }

  init(): void {
    const { clientWidth, clientHeight } = this.canvas

    this.renderer.setSize(clientWidth, clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x0A0A0F, 1)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0

    this.scene.background = new THREE.Color(0x0A0A0F)
    this.scene.fog = new THREE.FogExp2(0x0A0A0F, 0.04)

    this.scene.add(this.ambientLight)

    this.directionalLight.position.set(5, 8, 5)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.set(2048, 2048)
    this.directionalLight.shadow.camera.near = 0.1
    this.directionalLight.shadow.camera.far = 50
    this.directionalLight.shadow.bias = -0.001
    this.scene.add(this.directionalLight)

    const fillLight = new THREE.DirectionalLight(0x8B5CF6, 0.3)
    fillLight.position.set(-5, -3, -5)
    this.scene.add(fillLight)
    this.scene.add(new THREE.HemisphereLight(0x6C63FF, 0x0A0A0F, 0.2))

    // Effect lights (start off)
    this.fireLight.position.set(0, 1.2, 1)
    this.scene.add(this.fireLight)
    this.waterLight.position.set(0, -1, 1.5)
    this.scene.add(this.waterLight)

    this.camera.position.set(0, 0, 5)
    this.camera.lookAt(0, 0, 0)

    const grid = new THREE.GridHelper(20, 20, 0x1A1A24, 0x111118)
    grid.position.y = -2
    ;(grid.material as THREE.Material).opacity = 0.4
    ;(grid.material as THREE.Material).transparent = true
    this.scene.add(grid)

    this.createDefaultCube()
    this.animate()
  }

  // ─── Default cube ───────────────────────────────────────────

  private createDefaultCube(): void {
    const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const mat = new THREE.MeshStandardMaterial({ color: 0x6C63FF, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    this.defaultCube = new THREE.Mesh(geo, mat)
    this.defaultCube.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x6C63FF, wireframe: true, transparent: true, opacity: 0.6 })))
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x8B5CF6, transparent: true, opacity: 0.8 })
    this.defaultCube.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat))
    this.scene.add(this.defaultCube)
  }

  // ─── Texture / Mesh building ────────────────────────────────

  async loadTexture(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(url, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearMipmapLinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = true

        this.currentTexture = texture
        this.textureAspect = texture.image.width / texture.image.height

        if (this.defaultCube) {
          this.scene.remove(this.defaultCube)
          this.defaultCube.geometry.dispose()
          this.defaultCube = null
        }

        this.buildMesh(false)
        resolve()
      }, undefined, reject)
    })
  }

  private buildMesh(isRebuild: boolean): void {
    const prevGroupScale = this.meshGroup?.scale.x ?? 0

    // Tear down old group
    if (this.meshGroup) {
      this.scene.remove(this.meshGroup)
      this.disposeMeshGroup()
    }

    this.meshGroup = new THREE.Group()
    this.mainMesh = null
    this.outlineMesh = null

    if (!this.currentTexture) {
      this.scene.add(this.meshGroup)
      return
    }

    const w = 3
    const h = w / this.textureAspect
    const d = this.currentThickness

    if (d < 0.001) {
      const geo = new THREE.PlaneGeometry(w, h, 1, 1)
      this.mainMesh = new THREE.Mesh(geo, this.makeFrontMaterial())
    } else {
      // Front face at z = +d/2
      const frontGeo = new THREE.PlaneGeometry(w, h, 1, 1)
      this.mainMesh = new THREE.Mesh(frontGeo, this.makeFrontMaterial())
      this.mainMesh.position.z = d / 2

      // Back face at z = -d/2 (dark, BackSide)
      const backMat = new THREE.MeshStandardMaterial({
        map: this.currentTexture!,
        alphaTest: 0.05,
        transparent: true,
        color: new THREE.Color(0x0C0C12),
        roughness: 0.9,
        side: THREE.BackSide
      })
      const backMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 1, 1), backMat)
      backMesh.position.z = -d / 2
      backMesh.receiveShadow = true
      this.meshGroup.add(backMesh)

      // Interior edge-fill slices — solid dark planes clipped by PNG alpha.
      // These fill the hollow gap visible when viewing from the side.
      const numInterior = Math.max(1, Math.min(6, Math.ceil(d / 0.08)))
      const edgeColor = new THREE.Color(0x111118)
      for (let i = 1; i <= numInterior; i++) {
        const t = i / (numInterior + 1)
        const z = d * (t - 0.5)
        const fillMat = new THREE.MeshStandardMaterial({
          map: this.currentTexture!,
          alphaTest: 0.05,
          transparent: true,
          color: edgeColor,
          roughness: 0.9,
          side: THREE.DoubleSide
        })
        const fillMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 1, 1), fillMat)
        fillMesh.position.z = z
        this.meshGroup.add(fillMesh)
      }
    }

    this.mainMesh.receiveShadow = true
    this.mainMesh.castShadow = true
    this.meshGroup.add(this.mainMesh)

    this.scene.add(this.meshGroup)

    // On first load, start at scale 0 for GSAP entrance
    if (!isRebuild) {
      this.meshGroup.scale.setScalar(0)
      this.hasLoaded = true
    } else {
      this.meshGroup.scale.setScalar(prevGroupScale)
    }

    // Re-apply stored params after rebuild
    this.applyMaterialParamsToMesh(this.matParams)
    this.applyOutlineToMesh(this.outlineParams)
  }

  private makeFrontMaterial(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      map: this.currentTexture!,
      metalness: this.matParams.metalness ?? 0.1,
      roughness: this.matParams.roughness ?? 0.7,
      transparent: true,
      alphaTest: 0.01,
      opacity: this.matParams.opacity ?? 1,
      side: THREE.DoubleSide,
      color: new THREE.Color(this.matParams.colorTint ?? '#ffffff'),
      reflectivity: this.matParams.reflectivity ?? 0,
      clearcoat: (this.matParams.reflectivity ?? 0) * 0.5
    })
  }

  // ─── Material ───────────────────────────────────────────────

  private getFrontMat(): THREE.MeshPhysicalMaterial | null {
    if (!this.mainMesh) return null
    return this.mainMesh.material as THREE.MeshPhysicalMaterial
  }

  private applyMaterialParamsToMesh(p: MaterialParams): void {
    const mat = this.getFrontMat()
    if (!mat) return
    if (p.metalness   !== undefined) mat.metalness   = p.metalness
    if (p.roughness   !== undefined) mat.roughness   = p.roughness
    if (p.opacity     !== undefined) { mat.opacity = p.opacity; mat.transparent = true }
    if (p.wireframe   !== undefined) mat.wireframe   = p.wireframe
    if (p.colorTint   !== undefined) mat.color       = new THREE.Color(p.colorTint)
    if (p.reflectivity !== undefined) {
      mat.reflectivity = p.reflectivity
      mat.clearcoat    = p.reflectivity * 0.5
    }
    mat.needsUpdate = true
  }

  updateMaterial(p: MaterialParams): void {
    Object.assign(this.matParams, p)
    this.applyMaterialParamsToMesh(p)
  }

  // ─── Transform ──────────────────────────────────────────────

  updateTransform(p: TransformParams): void {
    if (!this.meshGroup) return
    if (p.position) this.basePos.set(p.position.x, p.position.y, p.position.z)
    if (p.rotation) this.baseRot.set(p.rotation.x, p.rotation.y, p.rotation.z)
    if (p.scale !== undefined) this.meshGroup.scale.setScalar(p.scale)
  }

  // ─── Lights ─────────────────────────────────────────────────

  updateLights(p: LightParams): void {
    if (p.ambientIntensity    !== undefined) this.ambientLight.intensity    = p.ambientIntensity
    if (p.directionalIntensity !== undefined) this.directionalLight.intensity = p.directionalIntensity
    if (p.lightPosition) this.directionalLight.position.set(p.lightPosition.x, p.lightPosition.y, p.lightPosition.z)
  }

  updateCamera(fov: number): void {
    this.camera.fov = fov
    this.camera.updateProjectionMatrix()
  }

  updateBgColor(color: string): void {
    const c = new THREE.Color(color)
    this.scene.background = c
    this.renderer.setClearColor(c, 1)
    this.scene.fog = new THREE.FogExp2(c.getHex(), 0.04)
  }

  // ─── Thickness ──────────────────────────────────────────────

  updateThickness(thickness: number): void {
    if (Math.abs(thickness - this.currentThickness) < 0.0001) return
    this.currentThickness = thickness
    if (this.hasLoaded) this.buildMesh(true)
  }

  // ─── Outline ────────────────────────────────────────────────

  private applyOutlineToMesh(p: OutlineParams): void {
    if (this.outlineMesh) {
      this.meshGroup?.remove(this.outlineMesh)
      this.outlineMesh.geometry.dispose()
      ;(this.outlineMesh.material as THREE.Material).dispose()
      this.outlineMesh = null
    }

    if (!p.enabled || !this.mainMesh) return

    const useBackSide = this.currentThickness >= 0.001

    const outlineMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(p.color),
      side: useBackSide ? THREE.BackSide : THREE.FrontSide,
      depthWrite: false
    })

    const geo = useBackSide
      ? this.mainMesh.geometry
      : (this.mainMesh.geometry as THREE.PlaneGeometry)

    this.outlineMesh = new THREE.Mesh(geo, outlineMat)
    const s = 1 + p.thickness
    this.outlineMesh.scale.set(s, s, useBackSide ? s : 1)

    if (!useBackSide) {
      this.outlineMesh.position.z = -0.003
      this.outlineMesh.renderOrder = -1
    }

    this.meshGroup!.add(this.outlineMesh)
  }

  updateOutline(p: OutlineParams): void {
    this.outlineParams = { ...p }
    this.applyOutlineToMesh(p)
  }

  // ─── Effects ────────────────────────────────────────────────

  setEffects(e: EffectsParams): void {
    this.effects = { ...e }
    // Immediately zero out lights if disabled
    if (!e.fire.enabled)  this.fireLight.intensity  = 0
    if (!e.water.enabled) this.waterLight.intensity = 0
  }

  // ─── Animation controls ─────────────────────────────────────

  setAutoRotate(enabled: boolean, speed = 0.5): void {
    this.autoRotateEnabled = enabled
    this.autoRotateSpeed = speed
  }

  setHoverEnabled(enabled: boolean): void {
    this.hoverEnabled = enabled
    if (!enabled) this.hoverTilt.set(0, 0)
  }

  // ─── Camera ─────────────────────────────────────────────────

  resetCamera(): void {
    this.spherical = { radius: 5, theta: 0, phi: Math.PI / 2 }
    this.updateCameraFromSpherical()
  }

  private updateCameraFromSpherical(): void {
    const { radius, theta, phi } = this.spherical
    this.camera.position.set(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta)
    )
    this.camera.lookAt(0, 0, 0)
  }

  // ─── Mouse ──────────────────────────────────────────────────

  handleMouseDown(e: MouseEvent): void {
    this.isDragging = true
    this.prevMouse = { x: e.clientX, y: e.clientY }
  }

  handleMouseMove(e: MouseEvent): void {
    // Update normalized mouse for hover
    const rect = this.canvas.getBoundingClientRect()
    this.mouseNorm.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    )

    if (!this.isDragging) return
    const dx = e.clientX - this.prevMouse.x
    const dy = e.clientY - this.prevMouse.y
    this.spherical.theta -= dx * 0.005
    this.spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.spherical.phi - dy * 0.005))
    this.updateCameraFromSpherical()
    this.prevMouse = { x: e.clientX, y: e.clientY }
  }

  handleMouseUp(): void { this.isDragging = false }

  handleMouseLeave(): void {
    this.isDragging = false
    this.mouseNorm.set(0, 0)
  }

  handleWheel(e: WheelEvent): void {
    e.preventDefault()
    this.spherical.radius = Math.max(1, Math.min(20, this.spherical.radius * (e.deltaY > 0 ? 1.1 : 0.9)))
    this.updateCameraFromSpherical()
  }

  zoomIn(): void  { this.spherical.radius = Math.max(1,  this.spherical.radius * 0.85); this.updateCameraFromSpherical() }
  zoomOut(): void { this.spherical.radius = Math.min(20, this.spherical.radius * 1.15); this.updateCameraFromSpherical() }

  // ─── Getters ────────────────────────────────────────────────

  getMesh(): THREE.Mesh | null { return this.mainMesh }
  getMeshGroup(): THREE.Group | null { return this.meshGroup }

  getCameraPosition() {
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

  // ─── Dispose ────────────────────────────────────────────────

  private disposeMeshGroup(): void {
    if (!this.meshGroup) return
    this.meshGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((m: THREE.Material) => {
          if ((m as THREE.MeshStandardMaterial).map) (m as THREE.MeshStandardMaterial).map!.dispose()
          m.dispose()
        })
      }
    })
  }

  dispose(): void {
    this.isDisposed = true
    cancelAnimationFrame(this.animationId)
    if (this.meshGroup) { this.scene.remove(this.meshGroup); this.disposeMeshGroup() }
    if (this.defaultCube) { this.scene.remove(this.defaultCube); this.defaultCube.geometry.dispose() }
    this.renderer.dispose()
  }

  // ─── Animate ────────────────────────────────────────────────

  private animate(): void {
    if (this.isDisposed) return
    this.animationId = requestAnimationFrame(() => this.animate())

    const t = performance.now() * 0.001

    // Default cube spin
    if (this.defaultCube) {
      this.defaultCube.rotation.x += 0.003
      this.defaultCube.rotation.y += 0.005
    }

    if (this.meshGroup) {
      // ── Auto-rotate accumulation
      if (this.autoRotateEnabled && !this.isDragging) {
        this.autoRotAngle += 0.01 * this.autoRotateSpeed
      }

      // ── Hover tilt (smooth lerp toward mouse direction)
      if (this.hoverEnabled) {
        const targetX = -this.mouseNorm.y * 0.12
        const targetY =  this.mouseNorm.x * 0.12
        this.hoverTilt.x += (targetX - this.hoverTilt.x) * 0.04
        this.hoverTilt.y += (targetY - this.hoverTilt.y) * 0.04
      }

      // ── Effect offsets
      let oy  = 0   // position Y offset
      let orx = 0   // rotation X offset
      let orz = 0   // rotation Z offset

      if (this.effects.float.enabled) {
        oy += Math.sin(t * 1.1) * 0.07 * this.effects.float.intensity
      }

      if (this.effects.wind.enabled) {
        const i = this.effects.wind.intensity
        orz += (Math.sin(t * 2.2) * 0.022 + Math.sin(t * 5.8) * 0.008) * i
        oy  += Math.sin(t * 1.6) * 0.018 * i
      }

      if (this.effects.water.enabled) {
        const i = this.effects.water.intensity
        oy  += (Math.sin(t * 0.85) * 0.055 + Math.sin(t * 2.1) * 0.015) * i
        orx += Math.sin(t * 1.4) * 0.014 * i
      }

      // ── Apply final transform
      this.meshGroup.position.set(
        this.basePos.x,
        this.basePos.y + oy,
        this.basePos.z
      )
      this.meshGroup.rotation.set(
        this.baseRot.x + orx + this.hoverTilt.x,
        this.baseRot.y + this.autoRotAngle,
        this.baseRot.z + orz + this.hoverTilt.y
      )

      // ── Fire: flickering warm point light
      if (this.effects.fire.enabled) {
        const fi = this.effects.fire.intensity
        this.fireLight.intensity = (1.0 + Math.sin(t * 13.7) * 0.45 + Math.sin(t * 7.3) * 0.2) * fi * 1.8
        this.fireLight.position.y = this.basePos.y + 0.6 + Math.sin(t * 8) * 0.12
      } else {
        this.fireLight.intensity = 0
      }

      // ── Water: cool oscillating point light
      if (this.effects.water.enabled) {
        const wi = this.effects.water.intensity
        this.waterLight.intensity = (0.6 + Math.sin(t * 1.8) * 0.35) * wi * 1.4
        this.waterLight.position.x = Math.sin(t * 0.7) * 1.5
      } else {
        this.waterLight.intensity = 0
      }
    }

    this.renderer.render(this.scene, this.camera)
  }
}
