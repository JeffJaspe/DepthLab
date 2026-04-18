<template>
  <div class="embed-root" :style="{ background: bgColor }">
    <canvas ref="canvasRef" class="embed-canvas" />

    <!-- Loading state -->
    <div v-if="isLoading" class="embed-loading">
      <div class="embed-spinner" />
    </div>

    <!-- Error state -->
    <div v-if="error" class="embed-error">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
        <path d="M12 7V12M12 16v.5" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:8px;">{{ error }}</p>
    </div>

    <!-- Branding watermark -->
    <a
      href="https://depthlab.vercel.app"
      target="_blank"
      rel="noopener"
      class="embed-brand"
    >
      DepthLab
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { deserializeConfig, type EmbedConfig } from '~/features/export-system/embedGenerator'

definePageMeta({ layout: false })

const route = useRoute()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const bgColor = ref('#0A0A0F')

let scene: any = null
let animId: number | null = null

onMounted(async () => {
  const raw = route.query.config as string | undefined
  if (!raw) {
    error.value = 'No config provided'
    isLoading.value = false
    return
  }

  let config: EmbedConfig
  try {
    config = deserializeConfig(raw)
  } catch {
    error.value = 'Invalid config'
    isLoading.value = false
    return
  }

  if (!config.imageUrl) {
    error.value = 'No image URL in config'
    isLoading.value = false
    return
  }

  bgColor.value = config.scene.bgColor ?? '#0A0A0F'

  try {
    await initEmbed(config)
  } catch (e) {
    error.value = 'Failed to load 3D viewer'
    console.error('[Embed]', e)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (animId !== null) cancelAnimationFrame(animId)
  scene?.dispose()
})

async function initEmbed(config: EmbedConfig) {
  const THREE = await import('three')

  const canvas = canvasRef.value!
  const w = canvas.clientWidth || window.innerWidth
  const h = canvas.clientHeight || window.innerHeight

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  const sceneObj = new THREE.Scene()
  sceneObj.background = new THREE.Color(config.scene.bgColor ?? '#0A0A0F')

  const camera = new THREE.PerspectiveCamera(config.scene.fov ?? 75, w / h, 0.1, 1000)

  // Spherical orbit state
  const spherical = { radius: 5, theta: 0, phi: Math.PI / 2 }

  function updateCamera() {
    camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta)
    camera.position.y = spherical.radius * Math.cos(spherical.phi)
    camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
    camera.lookAt(0, 0, 0)
  }
  updateCamera()

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, config.scene.ambientIntensity ?? 0.6)
  sceneObj.add(ambient)

  const dirLight = new THREE.DirectionalLight(0xffffff, config.scene.directionalIntensity ?? 1.2)
  const lp = config.scene.lightPosition
  dirLight.position.set(lp?.x ?? 5, lp?.y ?? 8, lp?.z ?? 5)
  sceneObj.add(dirLight)

  sceneObj.add(new THREE.HemisphereLight(0x6C63FF, 0x0A0A0F, 0.2))

  // Load texture
  const texture = await new THREE.TextureLoader().loadAsync(config.imageUrl)
  texture.colorSpace = THREE.SRGBColorSpace

  const aspect = texture.image.width / texture.image.height
  const geo = new THREE.PlaneGeometry(3, 3 / aspect, 32, 32)
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    metalness: config.scene.metalness ?? 0.1,
    roughness: config.scene.roughness ?? 0.7,
    transparent: true,
    alphaTest: 0.01,
    opacity: config.scene.opacity ?? 1,
    side: THREE.DoubleSide
  })

  const mesh = new THREE.Mesh(geo, mat)
  sceneObj.add(mesh)

  // Mouse orbit
  let dragging = false
  let prev = { x: 0, y: 0 }

  canvas.addEventListener('mousedown', (e) => { dragging = true; prev = { x: e.clientX, y: e.clientY } })
  canvas.addEventListener('mousemove', (e) => {
    if (!dragging) return
    spherical.theta -= (e.clientX - prev.x) * 0.005
    spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, spherical.phi - (e.clientY - prev.y) * 0.005))
    prev = { x: e.clientX, y: e.clientY }
    updateCamera()
  })
  canvas.addEventListener('mouseup', () => { dragging = false })
  canvas.addEventListener('mouseleave', () => { dragging = false })
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault()
    spherical.radius = Math.max(1, Math.min(20, spherical.radius * (e.deltaY > 0 ? 1.1 : 0.9)))
    updateCamera()
  }, { passive: false })

  // Touch support
  let lastTouch = { x: 0, y: 0 }
  canvas.addEventListener('touchstart', (e) => {
    dragging = true
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  })
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (!dragging) return
    spherical.theta -= (e.touches[0].clientX - lastTouch.x) * 0.005
    spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, spherical.phi - (e.touches[0].clientY - lastTouch.y) * 0.005))
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    updateCamera()
  }, { passive: false })
  canvas.addEventListener('touchend', () => { dragging = false })

  // Resize
  const resizeObserver = new ResizeObserver(() => {
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    renderer.setSize(cw, ch)
    camera.aspect = cw / ch
    camera.updateProjectionMatrix()
  })
  resizeObserver.observe(canvas)

  const autoRotate = config.scene.autoRotate ?? false
  const autoRotateSpeed = config.scene.autoRotateSpeed ?? 0.5

  function animate() {
    animId = requestAnimationFrame(animate)
    if (autoRotate && !dragging) {
      mesh.rotation.y += 0.01 * autoRotateSpeed
    }
    renderer.render(sceneObj, camera)
  }

  animate()

  scene = {
    dispose: () => {
      resizeObserver.disconnect()
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      texture.dispose()
    }
  }
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #0A0A0F;
}
</style>

<style scoped>
.embed-root {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.embed-canvas {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  display: block;
  cursor: grab;
}

.embed-canvas:active {
  cursor: grabbing;
}

.embed-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.embed-spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid rgba(108, 99, 255, 0.2);
  border-top-color: #6C63FF;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.embed-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.embed-brand {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.2);
  text-decoration: none;
  letter-spacing: 0.05em;
  transition: color 0.15s ease;
}

.embed-brand:hover {
  color: rgba(255, 255, 255, 0.5);
}
</style>
