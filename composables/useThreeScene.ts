import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { useSceneStore } from '~/stores/sceneStore'
import { useEditorStore } from '~/stores/editorStore'

let ThreeSceneClass: typeof import('~/features/threejs/ThreeScene').ThreeScene | null = null
let gsapLib: typeof import('gsap').gsap | null = null

async function loadDeps() {
  if (!ThreeSceneClass) {
    const mod = await import('~/features/threejs/ThreeScene')
    ThreeSceneClass = mod.ThreeScene
  }
  if (!gsapLib) {
    const { gsap } = await import('gsap')
    gsapLib = gsap
  }
}

export function useThreeScene(canvasRef: Ref<HTMLCanvasElement | null>) {
  const sceneStore = useSceneStore()
  const editorStore = useEditorStore()

  let threeScene: InstanceType<typeof import('~/features/threejs/ThreeScene').ThreeScene> | null = null
  const isReady = ref(false)
  const cameraPos = ref({ x: 0, y: 0, z: 5 })

  async function initScene() {
    if (!canvasRef.value) return
    await loadDeps()
    if (!ThreeSceneClass) return

    threeScene = new ThreeSceneClass(canvasRef.value)
    threeScene.init()
    isReady.value = true

    threeScene.updateLights({
      ambientIntensity: sceneStore.ambientIntensity,
      directionalIntensity: sceneStore.directionalIntensity,
      lightPosition: sceneStore.lightPosition
    })
    threeScene.updateCamera(sceneStore.fov)
    threeScene.setAutoRotate(sceneStore.autoRotate, sceneStore.autoRotateSpeed)
    threeScene.setHoverEnabled(sceneStore.hoverEnabled)
    threeScene.updateBgColor(sceneStore.bgColor)

    startCameraPolling()
  }

  let cameraPollingId: number | null = null

  function startCameraPolling() {
    function tick() {
      if (threeScene) {
        const pos = threeScene.getCameraPosition()
        cameraPos.value = pos
        sceneStore.setCameraPosition(pos)
      }
      cameraPollingId = requestAnimationFrame(tick)
    }
    cameraPollingId = requestAnimationFrame(tick)
  }

  async function loadTexture(url: string) {
    if (!threeScene) return

    await threeScene.loadTexture(url)

    // Apply any pending thickness before GSAP entrance
    threeScene.updateThickness(sceneStore.thickness)

    const group = threeScene.getMeshGroup()
    if (group && gsapLib) {
      gsapLib.fromTo(
        group.scale,
        { x: 0, y: 0, z: 0 },
        { x: sceneStore.scale, y: sceneStore.scale, z: sceneStore.scale, duration: 0.6, ease: 'back.out(1.7)' }
      )
    }

    threeScene.updateMaterial({
      metalness: sceneStore.metalness,
      roughness: sceneStore.roughness,
      opacity: sceneStore.opacity,
      wireframe: sceneStore.wireframe,
      colorTint: sceneStore.colorTint,
      reflectivity: sceneStore.reflectivity
    })

    threeScene.updateOutline({
      enabled: sceneStore.outlineEnabled,
      color: sceneStore.outlineColor,
      thickness: sceneStore.outlineThickness
    })

    threeScene.setEffects({
      fire:  { enabled: sceneStore.fireEnabled,  intensity: sceneStore.fireIntensity  },
      water: { enabled: sceneStore.waterEnabled, intensity: sceneStore.waterIntensity },
      wind:  { enabled: sceneStore.windEnabled,  intensity: sceneStore.windIntensity  },
      float: { enabled: sceneStore.floatEnabled, intensity: sceneStore.floatIntensity }
    })
  }

  function updateScene() {
    if (!threeScene) return

    threeScene.updateMaterial({
      metalness: sceneStore.metalness,
      roughness: sceneStore.roughness,
      opacity: sceneStore.opacity,
      wireframe: sceneStore.wireframe,
      colorTint: sceneStore.colorTint,
      reflectivity: sceneStore.reflectivity
    })

    threeScene.updateTransform({
      position: sceneStore.position,
      rotation: sceneStore.rotation,
      scale: sceneStore.scale
    })

    threeScene.updateLights({
      ambientIntensity: sceneStore.ambientIntensity,
      directionalIntensity: sceneStore.directionalIntensity,
      lightPosition: sceneStore.lightPosition
    })

    threeScene.updateCamera(sceneStore.fov)
    threeScene.setAutoRotate(sceneStore.autoRotate, sceneStore.autoRotateSpeed)
    threeScene.setHoverEnabled(sceneStore.hoverEnabled)
    threeScene.updateBgColor(sceneStore.bgColor)
    threeScene.updateThickness(sceneStore.thickness)

    threeScene.updateOutline({
      enabled: sceneStore.outlineEnabled,
      color: sceneStore.outlineColor,
      thickness: sceneStore.outlineThickness
    })

    threeScene.setEffects({
      fire:  { enabled: sceneStore.fireEnabled,  intensity: sceneStore.fireIntensity  },
      water: { enabled: sceneStore.waterEnabled, intensity: sceneStore.waterIntensity },
      wind:  { enabled: sceneStore.windEnabled,  intensity: sceneStore.windIntensity  },
      float: { enabled: sceneStore.floatEnabled, intensity: sceneStore.floatIntensity }
    })
  }

  function resetCamera() { threeScene?.resetCamera() }
  function zoomIn()  { threeScene?.zoomIn()  }
  function zoomOut() { threeScene?.zoomOut() }

  function handleMouseDown(e: MouseEvent)  { threeScene?.handleMouseDown(e) }
  function handleMouseMove(e: MouseEvent)  { threeScene?.handleMouseMove(e) }
  function handleMouseUp()                 { threeScene?.handleMouseUp()    }
  function handleMouseLeave()              { threeScene?.handleMouseLeave() }
  function handleWheel(e: WheelEvent)      { threeScene?.handleWheel(e)     }
  function resize(w: number, h: number)    { threeScene?.resize(w, h)       }

  function dispose() {
    if (cameraPollingId !== null) { cancelAnimationFrame(cameraPollingId); cameraPollingId = null }
    threeScene?.dispose()
    threeScene = null
    isReady.value = false
  }

  // Watch all scene state — one watcher is fine at this scale
  watch(
    () => [
      sceneStore.position, sceneStore.rotation, sceneStore.scale,
      sceneStore.metalness, sceneStore.roughness, sceneStore.opacity, sceneStore.wireframe,
      sceneStore.colorTint, sceneStore.reflectivity, sceneStore.materialPreset,
      sceneStore.thickness,
      sceneStore.outlineEnabled, sceneStore.outlineColor, sceneStore.outlineThickness,
      sceneStore.ambientIntensity, sceneStore.directionalIntensity, sceneStore.lightPosition,
      sceneStore.fov,
      sceneStore.autoRotate, sceneStore.autoRotateSpeed,
      sceneStore.floatEnabled, sceneStore.floatIntensity, sceneStore.hoverEnabled,
      sceneStore.fireEnabled, sceneStore.fireIntensity,
      sceneStore.waterEnabled, sceneStore.waterIntensity,
      sceneStore.windEnabled, sceneStore.windIntensity,
      sceneStore.bgColor
    ],
    () => { if (isReady.value) updateScene() },
    { deep: true }
  )

  watch(
    () => editorStore.activeImageUrl,
    async (url) => { if (url && isReady.value) await loadTexture(url) }
  )

  onMounted(async () => { await initScene() })
  onUnmounted(() => { dispose() })

  return {
    isReady, cameraPos,
    loadTexture, updateScene, resetCamera,
    zoomIn, zoomOut,
    handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleWheel,
    resize, dispose
  }
}
