<template>
  <aside class="left-sidebar">
    <div class="sidebar-content">

      <!-- ─── UPLOAD SECTION ─────────────────────────────── -->
      <section class="sidebar-section">
        <div class="section-header">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="text-accent">
            <path d="M8 2V10M8 2L5 5M8 2L11 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M2 12H14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <span class="sidebar-label">Upload</span>
        </div>

        <!-- Drop zone -->
        <div
          class="drop-zone rounded-lg p-4 cursor-pointer flex flex-col items-center gap-2 mt-2"
          :class="{ 'drag-over': isDragOver }"
          @click="triggerFileInput"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            class="hidden"
            @change="handleFileChange"
          />

          <div v-if="editorStore.uploadedImageUrl" class="w-full">
            <div class="relative">
              <img
                :src="editorStore.activeImageUrl || editorStore.uploadedImageUrl"
                alt="Uploaded image"
                class="w-full h-20 object-cover rounded-md border border-white/10"
                :style="{ background: 'repeating-conic-gradient(#1a1a2e 0% 25%, #0d0d1a 0% 50%) 0 0 / 12px 12px' }"
              />
              <!-- Processing indicator -->
              <div
                v-if="editorStore.isProcessingBg"
                class="absolute inset-0 rounded-md flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <div class="processing-spinner" />
              </div>
              <!-- BG removed badge -->
              <div
                v-else-if="editorStore.processedImageUrl"
                class="absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent border border-accent/30"
              >
                BG removed
              </div>
              <button
                class="absolute top-1 right-1 w-5 h-5 rounded bg-black/60 hover:bg-black/80 flex items-center justify-center transition-fast"
                @click.stop="clearImage"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2L10 10M10 2L2 10" stroke="white" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
            </div>
            <p class="text-xs text-text-muted mt-1.5 truncate text-center">
              {{ editorStore.uploadedImageName }}
            </p>
          </div>

          <template v-else>
            <div class="drop-icon">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="24" height="24" rx="4" stroke="rgba(108,99,255,0.5)" stroke-width="1.5" stroke-dasharray="4 3" />
                <path d="M16 11V21M16 11L12 15M16 11L20 15" stroke="rgba(108,99,255,0.8)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M10 22H22" stroke="rgba(108,99,255,0.4)" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
            <div class="text-center">
              <p class="text-xs text-text-secondary font-medium">Drop image here</p>
              <p class="text-xs text-text-muted mt-0.5">PNG · JPG · SVG</p>
            </div>
          </template>
        </div>

        <!-- BG Removal toggle -->
        <div v-if="editorStore.uploadedImageUrl" class="bg-removal-row mt-3">
          <div class="flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" class="text-accent shrink-0">
              <path d="M2 8L6 12L14 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="text-xs text-text-secondary">Remove Background</span>
          </div>
          <label
            class="toggle-switch cursor-pointer"
            @click.prevent="toggleBgRemoval"
          >
            <div class="toggle-track" :class="{ active: editorStore.bgRemovalEnabled }">
              <div class="toggle-thumb" :class="{ active: editorStore.bgRemovalEnabled }" />
            </div>
          </label>
        </div>
      </section>

      <UiSeparator />

      <!-- ─── TOOLS SECTION ─────────────────────────────── -->
      <section class="sidebar-section">
        <div class="section-header">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="text-accent">
            <path d="M9 1L15 7L7 15L1 9L9 1Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
          </svg>
          <span class="sidebar-label">Tools</span>
        </div>

        <div class="tools-strip mt-2">
          <UiTooltip
            v-for="tool in tools"
            :key="tool.id"
            :text="tool.label"
            position="right"
          >
            <button
              class="tool-btn"
              :class="{ 'active': editorStore.selectedTool === tool.id }"
              @click="editorStore.setTool(tool.id as any)"
            >
              <component :is="tool.icon" />
            </button>
          </UiTooltip>

          <UiSeparator class="my-1" />

          <UiTooltip text="Reset View" position="right">
            <button class="tool-btn" @click="emit('resetView')">
              <ResetViewIcon />
            </button>
          </UiTooltip>
        </div>
      </section>

      <UiSeparator />

      <!-- ─── RECENT PROJECTS ────────────────────────────── -->
      <section class="sidebar-section flex-1 overflow-hidden flex flex-col">
        <div class="section-header">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" class="text-accent">
            <path d="M2 3H6L8 5H14V13H2V3Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
          </svg>
          <span class="sidebar-label">Recent</span>
        </div>

        <div class="recent-list mt-2 flex flex-col gap-1 overflow-y-auto">
          <button
            v-for="project in recentProjects"
            :key="project.id"
            class="recent-item group"
          >
            <div class="recent-thumb shrink-0" :style="{ background: project.color }" />
            <div class="min-w-0 flex-1 text-left">
              <p class="text-xs text-text-secondary group-hover:text-text-primary transition-fast truncate">
                {{ project.name }}
              </p>
              <p class="text-xs text-text-muted mt-0.5">{{ project.date }}</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, defineComponent, h, watch } from 'vue'
import { useEditorStore } from '~/stores/editorStore'
import { processImageFile, removeBackground } from '~/features/image-processing/imageProcessor'

const emit = defineEmits<{ resetView: [] }>()
const editorStore = useEditorStore()
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

// ── Tool icons ───────────────────────────────────────────────

const SelectIcon = defineComponent({
  render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 16 16', fill: 'none' }, [
    h('path', { d: 'M3 1L13 8L8.5 9.5L6 14L3 1Z', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linejoin': 'round' })
  ])
})

const MoveIcon = defineComponent({
  render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 16 16', fill: 'none' }, [
    h('path', { d: 'M8 2V14M2 8H14M8 2L6 4M8 2L10 4M8 14L6 12M8 14L10 12M2 8L4 6M2 8L4 10M14 8L12 6M14 8L12 10', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
  ])
})

const RotateIcon = defineComponent({
  render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 16 16', fill: 'none' }, [
    h('path', { d: 'M14 8C14 11.314 11.314 14 8 14C4.686 14 2 11.314 2 8C2 4.686 4.686 2 8 2', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round' }),
    h('path', { d: 'M10 2H14V6', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    h('path', { d: 'M8 2L14 2', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round' })
  ])
})

const ScaleIcon = defineComponent({
  render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 16 16', fill: 'none' }, [
    h('rect', { x: '4', y: '4', width: '8', height: '8', rx: '1', stroke: 'currentColor', 'stroke-width': '1.3' }),
    h('path', { d: 'M1 1H4M1 1V4M15 1H12M15 1V4M1 15H4M1 15V12M15 15H12M15 15V12', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round' })
  ])
})

const ResetViewIcon = defineComponent({
  render: () => h('svg', { width: 15, height: 15, viewBox: '0 0 16 16', fill: 'none' }, [
    h('path', { d: 'M8 1C4.134 1 1 4.134 1 8C1 11.866 4.134 15 8 15C11.866 15 15 11.866 15 8', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round' }),
    h('path', { d: 'M11 1L15 1L15 5', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    h('path', { d: 'M8 5V8L10 10', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round' })
  ])
})

const tools = [
  { id: 'select', label: 'Select (V)', icon: SelectIcon },
  { id: 'move', label: 'Move (G)', icon: MoveIcon },
  { id: 'rotate', label: 'Rotate (R)', icon: RotateIcon },
  { id: 'scale', label: 'Scale (S)', icon: ScaleIcon }
]

const recentProjects = [
  { id: 1, name: 'Mountain Terrain', date: '2 hours ago', color: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' },
  { id: 2, name: 'Product Shot v2', date: 'Yesterday', color: 'linear-gradient(135deg, #FF6B6B, #FF8E53)' },
  { id: 3, name: 'Logo 3D Render', date: '3 days ago', color: 'linear-gradient(135deg, #22C55E, #16A34A)' }
]

// ── Handlers ─────────────────────────────────────────────────

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) processFile(file)
  target.value = ''
}

function handleDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

async function processFile(file: File) {
  const processed = await processImageFile(file)
  editorStore.uploadImage(processed.url, file.name)

  // Run bg removal immediately if enabled
  if (editorStore.bgRemovalEnabled) {
    await runBgRemoval(processed.url)
  }
}

async function runBgRemoval(sourceUrl: string) {
  editorStore.setProcessingBg(true)
  try {
    const result = await removeBackground(sourceUrl)
    editorStore.setProcessedImageUrl(result)
  } catch (err) {
    console.error('[BgRemoval] Failed:', err)
    editorStore.setProcessedImageUrl(null)
  } finally {
    editorStore.setProcessingBg(false)
  }
}

async function toggleBgRemoval() {
  const next = !editorStore.bgRemovalEnabled
  editorStore.setBgRemovalEnabled(next)

  if (next && editorStore.uploadedImageUrl) {
    await runBgRemoval(editorStore.uploadedImageUrl)
  } else {
    editorStore.setProcessedImageUrl(null)
  }
}

// Re-run bg removal if a new image is uploaded while toggle is on
watch(() => editorStore.uploadedImageUrl, async (url) => {
  if (url && editorStore.bgRemovalEnabled) {
    await runBgRemoval(url)
  }
})

function clearImage() {
  editorStore.clearImage()
}
</script>

<style scoped>
.left-sidebar {
  width: 220px;
  height: 100%;
  background: rgba(11, 11, 18, 0.9);
  backdrop-filter: blur(8px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-section {
  padding: 12px 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.bg-removal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(108, 99, 255, 0.05);
  border: 1px solid rgba(108, 99, 255, 0.12);
  border-radius: 8px;
}

.processing-spinner {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(108, 99, 255, 0.2);
  border-top-color: #6C63FF;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tools-strip {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  color: #6B6B8A;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #B0B0CC;
}

.tool-btn.active {
  background: rgba(108, 99, 255, 0.15);
  border-color: rgba(108, 99, 255, 0.4);
  color: #8B5CF6;
  box-shadow: 0 0 8px rgba(108, 99, 255, 0.2);
}

.recent-list { flex: 1; }

.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.recent-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.06);
}

.recent-thumb {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.drop-icon {
  filter: drop-shadow(0 0 8px rgba(108, 99, 255, 0.3));
}
</style>
