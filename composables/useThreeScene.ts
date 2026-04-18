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

    const mesh = threeScene.getMesh()
    if (mesh && gsapLib) {
      gsapLib.fromTo(
        mesh.scale,
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.7)' }
      )
    }

    threeScene.updateMaterial({
      metalness: sceneStore.metalness,
      roughness: sceneStore.roughness,
      opacity: sceneStore.opacity,
      wireframe: sceneStore.wireframe
    })
  }

  function updateScene() {
    if (!threeScene) return

    threeScene.updateMaterial({
      metalness: sceneStore.metalness,
      roughness: sceneStore.roughness,
      opacity: sceneStore.opacity,
      wireframe: sceneStore.wireframe
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
    threeScene.updateBgColor(sceneStore.bgColor)
  }

  function resetCamera() {
    threeScene?.resetCamera()
  }

  function zoomIn() { threeScene?.zoomIn() }
  function zoomOut() { threeScene?.zoomOut() }
  function handleMouseDown(e: MouseEvent) { threeScene?.handleMouseDown(e) }
  function handleMouseMove(e: MouseEvent) { threeScene?.handleMouseMove(e) }
  function handleMouseUp() { threeScene?.handleMouseUp() }
  function handleWheel(e: WheelEvent) { threeScene?.handleWheel(e) }
  function resize(w: number, h: number) { threeScene?.resize(w, h) }

  function dispose() {
    if (cameraPollingId !== null) {
      cancelAnimationFrame(cameraPollingId)
      cameraPollingId = null
    }
    threeScene?.dispose()
    threeScene = null
    isReady.value = false
  }

  watch(
    () => [
      sceneStore.position,
      sceneStore.rotation,
      sceneStore.scale,
      sceneStore.metalness,
      sceneStore.roughness,
      sceneStore.opacity,
      sceneStore.wireframe,
      sceneStore.ambientIntensity,
      sceneStore.directionalIntensity,
      sceneStore.lightPosition,
      sceneStore.fov,
      sceneStore.autoRotate,
      sceneStore.autoRotateSpeed,
      sceneStore.bgColor
    ],
    () => { if (isReady.value) updateScene() },
    { deep: true }
  )

  // Watch the active image URL (processed or original)
  watch(
    () => editorStore.activeImageUrl,
    async (url) => {
      if (url && isReady.value) {
        await loadTexture(url)
      }
    }
  )

  onMounted(async () => { await initScene() })
  onUnmounted(() => { dispose() })

  return {
    isReady,
    cameraPos,
    loadTexture,
    updateScene,
    resetCamera,
    zoomIn,
    zoomOut,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    resize,
    dispose
  }
}
