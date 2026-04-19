import * as THREE from 'three'
import { createSolidFromImage, MAT_FRONT, MAT_SIDES, traceSilhouettePath } from './geometry/createSolidMesh'
import { AnimationController } from './animations/AnimationController'
import type { AnimationParamsMap } from './animations/types'

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
  // Silhouette boundary path cached per image load — reused across thickness rebuilds
  private silhouettePath: Array<[number, number]> | null = null

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

  // Animation system
  private animController!: AnimationController
  private animParams: AnimationParamsMap = {
    float:    { amplitude: 0.5, speed: 1.0 },
    rotate:   { speed: 0.5, axisX: false, axisY: true, axisZ: false },
    dissolve: { amount: 0.0, edgeGlow: 0.6, speed: 0.3, looping: true },
    explode:  { force: 1.0, spread: 1.5 },
    wave:     { frequency: 2.0, amplitude: 0.4 },
    pulse:    { intensity: 0.15, speed: 1.0 },
    glow:     { color: '#6C63FF', intensity: 0.5, speed: 1.0 },
  }
  private userScale: number = 1
  private lastFrameTime: number = 0

  // RAF + input state
  private animationId: number = 0
  private isDragging = false
  private prevMouse = { x: 0, y: 0 }
  private autoRotateEnabled = false
  private autoRotateSpeed = 0.5
  private hoverEnabled = false
  // Slight offset from dead-centre so box sides are visible on first load
  private spherical = { radius: 5, theta: 0.18, phi: Math.PI / 2 - 0.14 }
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
    this.renderer.toneMappingExposure = 1.2

    this.scene.background = new THREE.Color(0x0A0A0F)
    this.scene.fog = new THREE.FogExp2(0x0A0A0F, 0.02) // lighter fog — don't obscure depth

    // ── Ambient: high enough that metallic presets don't go pitch-black without envMap
    this.ambientLight.intensity = 0.6
    this.scene.add(this.ambientLight)

    // ── Main key light: angled from upper-left-front so it lights the front face
    // but leaves the right/bottom sides noticeably darker → reveals depth.
    this.directionalLight.position.set(2.5, 5, 4)
    this.directionalLight.intensity = 1.8
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.set(2048, 2048)
    this.directionalLight.shadow.camera.near = 0.1
    this.directionalLight.shadow.camera.far = 50
    this.directionalLight.shadow.bias = -0.001
    this.scene.add(this.directionalLight)

    // ── Rim light: cool-blue from the right, low intensity.
    // Catches the right-side face of the box with a faint blue sheen that
    // separates it tonally from both the dark side and the lit front.
    const rimLight = new THREE.DirectionalLight(0x4466cc, 0.55)
    rimLight.position.set(4, 1, 2)
    this.scene.add(rimLight)

    // ── Back fill: subtle purple bounce from below-behind
    const fillLight = new THREE.DirectionalLight(0x8B5CF6, 0.25)
    fillLight.position.set(-3, -2, -4)
    this.scene.add(fillLight)

    this.scene.add(new THREE.HemisphereLight(0x6C63FF, 0x0A0A0F, 0.3))

    // ── Effect lights (start off)
    this.fireLight.position.set(0, 1.2, 1)
    this.scene.add(this.fireLight)
    this.waterLight.position.set(0, -1, 1.5)
    this.scene.add(this.waterLight)

    // ── Camera: use spherical so resetCamera() stays consistent
    this.updateCameraFromSpherical()

    // ── Grid + shadow-receiving ground plane
    const grid = new THREE.GridHelper(20, 20, 0x1A1A24, 0x111118)
    grid.position.y = -2
    ;(grid.material as THREE.Material).opacity = 0.4
    ;(grid.material as THREE.Material).transparent = true
    this.scene.add(grid)

    // Invisible plane that only renders cast shadows — grounds the object
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.35, transparent: true })
    )
    shadowPlane.rotation.x = -Math.PI / 2
    shadowPlane.position.y = -2
    shadowPlane.receiveShadow = true
    this.scene.add(shadowPlane)

    this.animController = new AnimationController({
      meshGroup: this.meshGroup ?? new THREE.Group(),
      mainMesh:  this.mainMesh,
      scene:     this.scene,
    })

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

        // Dispose previous texture; silhouettePath is just an array — no disposal needed
        this.currentTexture?.dispose()

        this.currentTexture = texture
        this.textureAspect = texture.image.width / texture.image.height

        // Trace silhouette once — reused for all subsequent thickness rebuilds
        this.silhouettePath = traceSilhouettePath(texture)

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

    if (this.meshGroup) {
      // Let animation preset clean up resources tied to the old mesh BEFORE disposal
      this.animController?.cleanupForRebuild()
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
      // Flat plane — no depth
      const geo = new THREE.PlaneGeometry(w, h, 1, 1)
      this.mainMesh = new THREE.Mesh(geo, this.makeFrontMaterial())
      this.mainMesh.castShadow    = true
      this.mainMesh.receiveShadow = true
    } else {
      // ExtrudeGeometry following object silhouette — no pixel re-scan on slider drag
      this.mainMesh = createSolidFromImage(
        this.currentTexture, w, h, d, this.matParams,
        this.silhouettePath
      )
    }

    this.meshGroup.add(this.mainMesh)
    this.scene.add(this.meshGroup)

    if (!isRebuild) {
      this.meshGroup.scale.setScalar(0)
      this.hasLoaded = true
    } else {
      this.meshGroup.scale.setScalar(prevGroupScale)
    }

    this.applyMaterialParamsToMesh(this.matParams)
    this.applyOutlineToMesh(this.outlineParams)

    // Re-init animation preset with the new mesh/group
    if (this.meshGroup) {
      this.animController?.onMeshChanged({
        meshGroup: this.meshGroup,
        mainMesh:  this.mainMesh,
        scene:     this.scene,
      })
    }
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
    const mats = this.mainMesh.material
    if (Array.isArray(mats)) return mats[MAT_FRONT] as THREE.MeshPhysicalMaterial
    return mats as THREE.MeshPhysicalMaterial
  }

  private getSideMat(): THREE.MeshPhysicalMaterial | null {
    if (!this.mainMesh) return null
    const mats = this.mainMesh.material
    if (Array.isArray(mats)) return mats[MAT_SIDES] as THREE.MeshPhysicalMaterial
    return null
  }

  private applyMaterialParamsToMesh(p: MaterialParams): void {
    const mat = this.getFrontMat()
    if (mat) {
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

    const side = this.getSideMat()
    if (side) {
      if (p.colorTint    !== undefined) side.color        = new THREE.Color(p.colorTint)
      if (p.metalness    !== undefined) side.metalness    = p.metalness
      if (p.roughness    !== undefined) side.roughness    = Math.min(1, p.roughness + 0.15)
      if (p.opacity      !== undefined) { side.opacity = p.opacity; side.transparent = p.opacity < 1 }
      if (p.reflectivity !== undefined) { side.reflectivity = p.reflectivity; side.clearcoat = p.reflectivity * 0.5 }
      side.needsUpdate = true
    }
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
    if (p.scale !== undefined) { this.userScale = p.scale; this.meshGroup.scale.setScalar(p.scale) }
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
    this.spherical = { radius: 5, theta: 0.18, phi: Math.PI / 2 - 0.14 }
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

  // ─── Animation presets ──────────────────────────────────────

  setAnimationPreset(id: string, params: AnimationParamsMap): void {
    this.animParams = params
    if (this.meshGroup) {
      this.animController.setPreset(id, params)
    }
  }

  updateAnimationParams(params: AnimationParamsMap): void {
    this.animParams = params
  }

  // ─── Dispose ────────────────────────────────────────────────

  private disposeMeshGroup(): void {
    if (!this.meshGroup) return
    this.meshGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        // Dispose material objects only — textures (currentTexture + silhouetteEdges)
        // are managed explicitly in loadTexture() and dispose().
        mats.forEach((m: THREE.Material) => m.dispose())
      }
    })
  }

  dispose(): void {
    this.isDisposed = true
    cancelAnimationFrame(this.animationId)
    this.animController?.cleanup()
    if (this.meshGroup) { this.scene.remove(this.meshGroup); this.disposeMeshGroup() }
    this.currentTexture?.dispose()
    this.silhouettePath = null
    if (this.defaultCube) { this.scene.remove(this.defaultCube); this.defaultCube.geometry.dispose() }
    this.renderer.dispose()
  }

  // ─── Animate ────────────────────────────────────────────────

  private animate(): void {
    if (this.isDisposed) return
    this.animationId = requestAnimationFrame(() => this.animate())

    const now   = performance.now() * 0.001
    const delta = this.lastFrameTime > 0 ? Math.min(now - this.lastFrameTime, 0.1) : 0.016
    this.lastFrameTime = now

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

      // ── Legacy effect offsets
      let oy  = 0   // position Y offset
      let orx = 0   // rotation X offset
      let orz = 0   // rotation Z offset

      if (this.effects.float.enabled) {
        oy += Math.sin(now * 1.1) * 0.07 * this.effects.float.intensity
      }
      if (this.effects.wind.enabled) {
        const i = this.effects.wind.intensity
        orz += (Math.sin(now * 2.2) * 0.022 + Math.sin(now * 5.8) * 0.008) * i
        oy  += Math.sin(now * 1.6) * 0.018 * i
      }
      if (this.effects.water.enabled) {
        const i = this.effects.water.intensity
        oy  += (Math.sin(now * 0.85) * 0.055 + Math.sin(now * 2.1) * 0.015) * i
        orx += Math.sin(now * 1.4) * 0.014 * i
      }

      // ── Animation preset
      const anim = this.animController.update(this.animParams, delta, now)

      // ── Apply final transform
      this.meshGroup.position.set(
        this.basePos.x + anim.posOffset.x,
        this.basePos.y + oy + anim.posOffset.y,
        this.basePos.z + anim.posOffset.z
      )
      this.meshGroup.rotation.set(
        this.baseRot.x + orx + this.hoverTilt.x + anim.rotOffset.x,
        this.baseRot.y + this.autoRotAngle       + anim.rotOffset.y,
        this.baseRot.z + orz + this.hoverTilt.y  + anim.rotOffset.z
      )

      // Pulse / scale-affecting presets override user scale
      if (Math.abs(anim.scaleMult - 1) > 0.001) {
        this.meshGroup.scale.setScalar(this.userScale * anim.scaleMult)
      }

      // ── Fire: flickering warm point light
      if (this.effects.fire.enabled) {
        const fi = this.effects.fire.intensity
        this.fireLight.intensity = (1.0 + Math.sin(now * 13.7) * 0.45 + Math.sin(now * 7.3) * 0.2) * fi * 1.8
        this.fireLight.position.y = this.basePos.y + 0.6 + Math.sin(now * 8) * 0.12
      } else {
        this.fireLight.intensity = 0
      }

      // ── Water: cool oscillating point light
      if (this.effects.water.enabled) {
        const wi = this.effects.water.intensity
        this.waterLight.intensity = (0.6 + Math.sin(now * 1.8) * 0.35) * wi * 1.4
        this.waterLight.position.x = Math.sin(now * 0.7) * 1.5
      } else {
        this.waterLight.intensity = 0
      }
    }

    this.renderer.render(this.scene, this.camera)
  }
}
