<template>
  <footer class="status-bar">
    <div class="status-bar-inner">
      <!-- Left items -->
      <div class="flex items-center divide-x divide-white/5">
        <!-- Ready/status indicator -->
        <div class="statusbar-item">
          <span
            class="w-1.5 h-1.5 rounded-full shrink-0"
            :class="statusDotClass"
          />
          <span>{{ statusText }}</span>
        </div>

        <!-- Tool -->
        <div class="statusbar-item">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M3 1L13 8L8.5 9.5L6 14L3 1Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
          </svg>
          <span class="capitalize">{{ editorStore.selectedTool }}</span>
        </div>

        <!-- Image info -->
        <div v-if="editorStore.uploadedImageName" class="statusbar-item">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.2" />
            <circle cx="6" cy="6" r="1.5" fill="currentColor" />
            <path d="M2 11L5 8L8 11L11 7L14 11" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
          </svg>
          <span class="max-w-[120px] truncate">{{ editorStore.uploadedImageName }}</span>
        </div>
      </div>

      <!-- Center: version -->
      <div class="statusbar-item hidden md:flex absolute left-1/2 -translate-x-1/2">
        <span style="color: rgba(107,107,138,0.5);">DepthLab v1.0</span>
      </div>

      <!-- Right items -->
      <div class="flex items-center divide-x divide-white/5">
        <!-- Camera position -->
        <div class="statusbar-item font-mono text-xs">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M2 5h3l2-2h6l2 2h1v8H2V5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
            <circle cx="8" cy="9" r="2" stroke="currentColor" stroke-width="1.2" />
          </svg>
          <span>
            {{ fmt(sceneStore.cameraPosition.x) }},
            {{ fmt(sceneStore.cameraPosition.y) }},
            {{ fmt(sceneStore.cameraPosition.z) }}
          </span>
        </div>

        <!-- FOV -->
        <div class="statusbar-item">
          <span>FOV {{ sceneStore.fov }}°</span>
        </div>

        <!-- FPS placeholder -->
        <div class="statusbar-item">
          <span class="text-success">60 fps</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '~/stores/editorStore'
import { useSceneStore } from '~/stores/sceneStore'

const editorStore = useEditorStore()
const sceneStore = useSceneStore()

const statusText = computed(() => {
  if (editorStore.isGenerating) return 'Generating…'
  if (!editorStore.isSaved) return 'Unsaved changes'
  if (editorStore.hasImage) return 'Ready'
  return 'No image loaded'
})

const statusDotClass = computed(() => {
  if (editorStore.isGenerating) return 'bg-warning animate-pulse'
  if (!editorStore.isSaved) return 'bg-accent animate-pulse-subtle'
  if (editorStore.hasImage) return 'bg-success'
  return 'bg-text-muted'
})

function fmt(v: number): string {
  return v.toFixed(1)
}
</script>

<style scoped>
.status-bar {
  height: 24px;
  background: rgba(8, 8, 14, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
  position: relative;
  z-index: 50;
}

.status-bar-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}
</style>
