<template>
  <header class="topbar">
    <div class="topbar-inner">
      <!-- Left: Logo + Project Name -->
      <div class="flex items-center gap-3 min-w-0">
        <!-- Logo -->
        <div class="flex items-center gap-2 shrink-0">
          <div class="logo-icon">
            <!-- 3D Cube SVG -->
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#cubeTop)" stroke="rgba(108,99,255,0.6)" stroke-width="0.5" />
              <path d="M2 7V17L12 22V12L2 7Z" fill="url(#cubeLeft)" stroke="rgba(108,99,255,0.4)" stroke-width="0.5" />
              <path d="M22 7V17L12 22V12L22 7Z" fill="url(#cubeRight)" stroke="rgba(139,92,246,0.4)" stroke-width="0.5" />
              <defs>
                <linearGradient id="cubeTop" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#8B5CF6" />
                  <stop offset="100%" stop-color="#6C63FF" />
                </linearGradient>
                <linearGradient id="cubeLeft" x1="2" y1="7" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#4C44C4" />
                  <stop offset="100%" stop-color="#2A2480" />
                </linearGradient>
                <linearGradient id="cubeRight" x1="12" y1="7" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#6C63FF" />
                  <stop offset="100%" stop-color="#4C44C4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="text-sm font-semibold text-text-primary tracking-tight">DepthLab</span>
        </div>

        <UiSeparator orientation="vertical" class="h-5 opacity-40" />

        <!-- Project Name (inline editable) -->
        <div class="project-name-wrapper">
          <input
            v-if="isEditingName"
            ref="nameInputRef"
            v-model="localName"
            class="project-name-input"
            type="text"
            maxlength="60"
            @blur="commitName"
            @keydown.enter="commitName"
            @keydown.escape="cancelEdit"
          />
          <button
            v-else
            class="project-name-display group"
            @click="startEdit"
          >
            <span>{{ editorStore.projectName }}</span>
            <!-- Edit icon -->
            <svg
              class="opacity-0 group-hover:opacity-50 transition-fast ml-1.5 shrink-0"
              width="12" height="12" viewBox="0 0 16 16" fill="none"
            >
              <path
                d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
              />
            </svg>
          </button>

          <!-- Unsaved indicator -->
          <span
            v-if="!editorStore.isSaved"
            class="unsaved-dot"
            title="Unsaved changes"
          />
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2">
        <!-- Save -->
        <UiButton
          variant="ghost"
          size="sm"
          :class="{ 'text-accent': !editorStore.isSaved }"
          @click="handleSave"
        >
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 3H10L13 6V13H3V3Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
              <path d="M5 3V6H10V3" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
              <rect x="5" y="9" width="6" height="4" rx="0.5" stroke="currentColor" stroke-width="1.3" />
            </svg>
          </template>
          Save
        </UiButton>

        <!-- Export -->
        <UiButton
          variant="outline"
          size="sm"
          :disabled="!editorStore.hasImage"
          @click="editorStore.openExportPanel()"
        >
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M2 12V13.5C2 13.78 2.22 14 2.5 14H13.5C13.78 14 14 13.78 14 13.5V12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
            </svg>
          </template>
          Export
        </UiButton>

        <!-- Generate 3D -->
        <UiButton
          variant="accent"
          size="sm"
          :loading="editorStore.isGenerating"
          loading-text="Processing..."
          @click="handleGenerate"
        >
          <template #icon>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1L10.5 5.5H14L11 8.5L12.5 13L8 10.5L3.5 13L5 8.5L2 5.5H5.5L8 1Z"
                stroke="white" stroke-width="1.2" stroke-linejoin="round" fill="rgba(255,255,255,0.15)"
              />
            </svg>
          </template>
          Generate 3D
        </UiButton>
      </div>
    </div>

    <!-- Gradient separator line -->
    <div class="topbar-gradient-line" />
  </header>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useEditorStore } from '~/stores/editorStore'

const editorStore = useEditorStore()

const isEditingName = ref(false)
const localName = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)

function startEdit() {
  localName.value = editorStore.projectName
  isEditingName.value = true
  nextTick(() => {
    nameInputRef.value?.select()
  })
}

function commitName() {
  const trimmed = localName.value.trim()
  if (trimmed) {
    editorStore.setProjectName(trimmed)
  }
  isEditingName.value = false
}

function cancelEdit() {
  isEditingName.value = false
}

function handleSave() {
  editorStore.save()
}

async function handleGenerate() {
  await editorStore.generate3D()
}
</script>

<style scoped>
.topbar {
  height: 48px;
  background: rgba(10, 10, 15, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  position: relative;
  z-index: 100;
  flex-shrink: 0;
}

.topbar-inner {
  height: 47px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.logo-icon {
  filter: drop-shadow(0 0 6px rgba(108, 99, 255, 0.4));
}

.project-name-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.project-name-display {
  display: flex;
  align-items: center;
  gap: 0;
  font-size: 13px;
  color: #B0B0CC;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 3px 6px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-name-display:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #F0F0FF;
}

.project-name-input {
  font-size: 13px;
  color: #F0F0FF;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(108, 99, 255, 0.4);
  border-radius: 6px;
  padding: 3px 8px;
  outline: none;
  min-width: 120px;
  max-width: 200px;
  box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.1);
}

.unsaved-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6C63FF;
  box-shadow: 0 0 6px rgba(108, 99, 255, 0.6);
  flex-shrink: 0;
  animation: pulse-subtle 2s ease-in-out infinite;
}
</style>
