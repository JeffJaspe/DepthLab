<template>
  <div
    ref="containerRef"
    class="canvas-container"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseUp"
  >
    <!-- Actual Three.js canvas -->
    <canvas
      ref="canvasRef"
      class="three-canvas"
      @mousedown="onMouseDown"
      @wheel.prevent="onWheel"
      @contextmenu.prevent
    />

    <!-- Grid overlay (CSS, doesn't affect Three.js) -->
    <div class="canvas-grid-bg absolute inset-0 pointer-events-none opacity-30" />

    <!-- Empty state overlay -->
    <Transition
      enter-active-class="transition-medium"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-medium"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="!editorStore.hasImage && threeReady"
        class="empty-state-overlay pointer-events-none"
      >
        <div class="empty-state-content">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L4 14V34L24 44L44 34V14L24 4Z" stroke="rgba(108,99,255,0.4)" stroke-width="1.5" />
              <path d="M24 4V44M4 14L44 14M4 34L44 34" stroke="rgba(108,99,255,0.15)" stroke-width="1" />
            </svg>
          </div>
          <p class="text-sm text-text-muted mt-2">Drop an image in the sidebar to begin</p>
          <p class="text-xs text-text-disabled mt-1">Drag to orbit · Scroll to zoom</p>
        </div>
      </div>
    </Transition>

    <!-- Coordinates overlay (bottom-left) -->
    <div class="coords-overlay">
      <div class="coord-item">
        <span class="coord-axis-label x">X</span>
        <span class="coord-value">{{ fmt(cameraPos.x) }}</span>
      </div>
      <div class="coord-item">
        <span class="coord-axis-label y">Y</span>
        <span class="coord-value">{{ fmt(cameraPos.y) }}</span>
      </div>
      <div class="coord-item">
        <span class="coord-axis-label z">Z</span>
        <span class="coord-value">{{ fmt(cameraPos.z) }}</span>
      </div>
    </div>

    <!-- Zoom controls (bottom-right) -->
    <div class="zoom-controls">
      <button class="zoom-btn" title="Zoom In" @click="zoomIn">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
      <div class="zoom-divider" />
      <button class="zoom-btn" title="Zoom Out" @click="zoomOut">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M3 8H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- Loading overlay when generating -->
    <Transition
      enter-active-class="transition-medium"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-medium"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="editorStore.isGenerating" class="generating-overlay">
        <div class="generating-content">
          <div class="generating-spinner" />
          <p class="text-sm font-medium text-text-primary mt-3">Processing depth map…</p>
          <p class="text-xs text-text-muted mt-1">Analyzing image structure</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '~/stores/editorStore'
import { useThreeScene } from '~/composables/useThreeScene'

const editorStore = useEditorStore()
const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const threeReady = ref(false)

const {
  isReady,
  cameraPos,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleWheel,
  zoomIn,
  zoomOut,
  resize,
  resetCamera,
  dispose
} = useThreeScene(canvasRef)

// Expose resetCamera to parent
defineExpose({ resetCamera })

// Watch ready state
watch(isReady, (val) => {
  if (val) threeReady.value = true
})

// Resize observer
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!containerRef.value) return

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (entry) {
      const { width, height } = entry.contentRect
      resize(Math.floor(width), Math.floor(height))
    }
  })

  resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  dispose()
})

function onMouseDown(e: MouseEvent) {
  handleMouseDown(e)
}

function onMouseMove(e: MouseEvent) {
  handleMouseMove(e)
}

function onMouseUp() {
  handleMouseUp()
}

function onWheel(e: WheelEvent) {
  handleWheel(e)
}

function fmt(v: number): string {
  return v.toFixed(2)
}
</script>

<style scoped>
.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #0A0A0F;
  cursor: grab;
}

.canvas-container:active {
  cursor: grabbing;
}

.three-canvas {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  display: block;
}

/* Coordinates display */
.coords-overlay {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 6px;
  z-index: 10;
  pointer-events: none;
}

.coord-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(10, 10, 15, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 3px 8px;
}

.coord-axis-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.coord-axis-label.x { color: #FF6B6B; }
.coord-axis-label.y { color: #22C55E; }
.coord-axis-label.z { color: #6C63FF; }

.coord-value {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 10px;
  color: #B0B0CC;
  min-width: 36px;
}

/* Zoom controls */
.zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  z-index: 10;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #6B6B8A;
  cursor: pointer;
  transition: all 0.15s ease;
}

.zoom-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #F0F0FF;
}

.zoom-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0 6px;
}

/* Empty state */
.empty-state-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  text-align: center;
}

.empty-icon {
  filter: drop-shadow(0 0 16px rgba(108, 99, 255, 0.25));
}

/* Generating overlay */
.generating-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.75);
  backdrop-filter: blur(4px);
  z-index: 20;
}

.generating-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.generating-spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(108, 99, 255, 0.2);
  border-top-color: #6C63FF;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
