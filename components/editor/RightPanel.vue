<template>
  <aside class="right-panel">
    <div class="panel-content">

      <!-- ─── TRANSFORM ──────────────────────────────────── -->
      <PanelSection title="Transform" icon="transform">
        <div class="space-y-3">
          <div class="subsection-label">Position</div>
          <UiSlider label="X" :model-value="sceneStore.position.x" :min="-5" :max="5" :step="0.01" :decimals="2" @update:model-value="sceneStore.setPosition('x', $event)" />
          <UiSlider label="Y" :model-value="sceneStore.position.y" :min="-5" :max="5" :step="0.01" :decimals="2" @update:model-value="sceneStore.setPosition('y', $event)" />
          <UiSlider label="Z" :model-value="sceneStore.position.z" :min="-5" :max="5" :step="0.01" :decimals="2" @update:model-value="sceneStore.setPosition('z', $event)" />

          <UiSeparator class="!my-2" />
          <div class="subsection-label">Rotation (deg)</div>
          <UiSlider label="X" :model-value="sceneStore.rotation.x" :min="-3.14159" :max="3.14159" :step="0.01" :decimals="1" unit="°" @update:model-value="sceneStore.setRotation('x', $event)" />
          <UiSlider label="Y" :model-value="sceneStore.rotation.y" :min="-3.14159" :max="3.14159" :step="0.01" :decimals="1" unit="°" @update:model-value="sceneStore.setRotation('y', $event)" />
          <UiSlider label="Z" :model-value="sceneStore.rotation.z" :min="-3.14159" :max="3.14159" :step="0.01" :decimals="1" unit="°" @update:model-value="sceneStore.setRotation('z', $event)" />

          <UiSeparator class="!my-2" />
          <UiSlider label="Scale" :model-value="sceneStore.scale" :min="0.1" :max="3" :step="0.01" :decimals="2" @update:model-value="sceneStore.setScale($event)" />
        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── ANIMATION ─────────────────────────────────── -->
      <PanelSection title="Animation" icon="animation">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" class="text-accent">
                <path d="M14 8C14 11.314 11.314 14 8 14C4.686 14 2 11.314 2 8C2 4.686 4.686 2 8 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
                <path d="M8 2L12 2L12 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="text-xs text-text-secondary">Auto Rotate</span>
            </div>
            <label class="toggle-switch cursor-pointer" @click.prevent="sceneStore.setAutoRotate(!sceneStore.autoRotate)">
              <div class="toggle-track" :class="{ active: sceneStore.autoRotate }">
                <div class="toggle-thumb" :class="{ active: sceneStore.autoRotate }" />
              </div>
            </label>
          </div>

          <UiSlider
            v-if="sceneStore.autoRotate"
            label="Speed"
            :model-value="sceneStore.autoRotateSpeed"
            :min="0.1" :max="5" :step="0.1" :decimals="1"
            @update:model-value="sceneStore.setAutoRotateSpeed($event)"
          />
        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── MATERIAL ───────────────────────────────────── -->
      <PanelSection title="Material" icon="material">
        <div class="space-y-3">
          <UiSlider label="Metalness" :model-value="sceneStore.metalness" :min="0" :max="1" :step="0.01" :decimals="2" @update:model-value="sceneStore.setMetalness($event)" />
          <UiSlider label="Roughness" :model-value="sceneStore.roughness" :min="0" :max="1" :step="0.01" :decimals="2" @update:model-value="sceneStore.setRoughness($event)" />
          <UiSlider label="Opacity" :model-value="sceneStore.opacity" :min="0" :max="1" :step="0.01" :decimals="2" @update:model-value="sceneStore.setOpacity($event)" />

          <UiSeparator class="!my-2" />

          <div class="flex items-center justify-between">
            <span class="text-xs text-text-muted select-none">Wireframe</span>
            <label class="toggle-switch cursor-pointer" @click.prevent="sceneStore.setWireframe(!sceneStore.wireframe)">
              <div class="toggle-track" :class="{ active: sceneStore.wireframe }">
                <div class="toggle-thumb" :class="{ active: sceneStore.wireframe }" />
              </div>
            </label>
          </div>
        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── LIGHTING ───────────────────────────────────── -->
      <PanelSection title="Lighting" icon="lighting">
        <div class="space-y-3">
          <UiSlider label="Ambient" :model-value="sceneStore.ambientIntensity" :min="0" :max="2" :step="0.01" :decimals="2" @update:model-value="sceneStore.setAmbientIntensity($event)" />
          <UiSlider label="Directional" :model-value="sceneStore.directionalIntensity" :min="0" :max="3" :step="0.01" :decimals="2" @update:model-value="sceneStore.setDirectionalIntensity($event)" />

          <UiSeparator class="!my-2" />
          <div class="subsection-label">Light Position</div>
          <UiSlider label="X" :model-value="sceneStore.lightPosition.x" :min="-10" :max="10" :step="0.1" :decimals="1" @update:model-value="sceneStore.setLightPosition('x', $event)" />
          <UiSlider label="Y" :model-value="sceneStore.lightPosition.y" :min="-10" :max="10" :step="0.1" :decimals="1" @update:model-value="sceneStore.setLightPosition('y', $event)" />
          <UiSlider label="Z" :model-value="sceneStore.lightPosition.z" :min="-10" :max="10" :step="0.1" :decimals="1" @update:model-value="sceneStore.setLightPosition('z', $event)" />
        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── SCENE ──────────────────────────────────────── -->
      <PanelSection title="Scene" icon="scene">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-muted">Background</span>
            <label class="color-swatch-label">
              <div class="color-preview" :style="{ background: sceneStore.bgColor }" />
              <input
                type="color"
                :value="sceneStore.bgColor"
                class="color-picker-hidden"
                @input="sceneStore.setBgColor(($event.target as HTMLInputElement).value)"
              />
            </label>
          </div>

          <div class="bg-presets">
            <button
              v-for="preset in bgPresets"
              :key="preset"
              class="bg-preset-btn"
              :style="{ background: preset }"
              :class="{ 'ring-1 ring-accent/60': sceneStore.bgColor === preset }"
              @click="sceneStore.setBgColor(preset)"
            />
          </div>
        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── CAMERA ─────────────────────────────────────── -->
      <PanelSection title="Camera" icon="camera">
        <div class="space-y-3">
          <UiSlider label="Field of View" :model-value="sceneStore.fov" :min="30" :max="120" :step="1" :decimals="0" unit="°" @update:model-value="sceneStore.setFov($event)" />

          <UiSeparator class="!my-2" />

          <div class="camera-pos-display">
            <span class="text-xs text-text-muted">Camera</span>
            <div class="flex gap-2 mt-1">
              <div class="coord-chip">
                <span class="coord-axis x">X</span>
                <span class="coord-val">{{ fmt(sceneStore.cameraPosition.x) }}</span>
              </div>
              <div class="coord-chip">
                <span class="coord-axis y">Y</span>
                <span class="coord-val">{{ fmt(sceneStore.cameraPosition.y) }}</span>
              </div>
              <div class="coord-chip">
                <span class="coord-axis z">Z</span>
                <span class="coord-val">{{ fmt(sceneStore.cameraPosition.z) }}</span>
              </div>
            </div>
          </div>

          <UiButton variant="outline" size="sm" class="w-full justify-center mt-1" @click="emit('resetCamera')">
            <template #icon>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
                <path d="M15 1v4h-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </template>
            Reset Camera
          </UiButton>
        </div>
      </PanelSection>

    </div>
  </aside>
</template>

<script setup lang="ts">
import { useSceneStore } from '~/stores/sceneStore'

const emit = defineEmits<{ resetCamera: [] }>()
const sceneStore = useSceneStore()

const bgPresets = ['#0A0A0F', '#FFFFFF', '#F5F5F0', '#1A1A2E', '#0D1B2A', '#2D1B3D']

function fmt(v: number): string {
  return v.toFixed(1)
}
</script>

<!-- Panel section sub-component (defined inline) -->
<script lang="ts">
import { defineComponent, h, ref } from 'vue'

export const PanelSection = defineComponent({
  name: 'PanelSection',
  props: {
    title: { type: String, required: true },
    icon: { type: String, default: '' }
  },
  setup(props, { slots }) {
    const isOpen = ref(true)

    const iconPaths: Record<string, string> = {
      transform: 'M8 1L14 4V12L8 15L2 12V4L8 1Z',
      animation: 'M14 8C14 11.314 11.314 14 8 14C4.686 14 2 11.314 2 8C2 4.686 4.686 2 8 2M8 2L12 2L12 6',
      material: 'M2 6h12M2 10h12M6 2v12M10 2v12',
      lighting: 'M8 2a5 5 0 0 1 5 5c0 2.5-1.5 4.5-4 5.4V14H7v-1.6C4.5 11.5 3 9.5 3 7a5 5 0 0 1 5-5z',
      scene: 'M2 12L8 4L14 12H2Z',
      camera: 'M2 5h3l2-2h6l2 2h1v8H2V5z M8 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'
    }

    return () => h('div', { class: 'panel-section-wrapper' }, [
      h('button', {
        class: 'panel-section-header',
        onClick: () => { isOpen.value = !isOpen.value }
      }, [
        h('div', { class: 'flex items-center gap-2' }, [
          h('svg', { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', class: 'text-accent opacity-70' }, [
            h('path', { d: iconPaths[props.icon] || 'M4 4h8v8H4z', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
          ]),
          h('span', { class: 'sidebar-label' }, props.title)
        ]),
        h('svg', {
          width: 10, height: 10, viewBox: '0 0 12 12', fill: 'none',
          style: { transform: isOpen.value ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s ease' }
        }, [
          h('path', { d: 'M2 4L6 8L10 4', stroke: '#6B6B8A', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
        ])
      ]),
      isOpen.value && slots.default
        ? h('div', { class: 'panel-section-body' }, slots.default())
        : null
    ])
  }
})
</script>

<style scoped>
.right-panel {
  width: 280px;
  height: 100%;
  background: rgba(11, 11, 18, 0.9);
  backdrop-filter: blur(8px);
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 16px;
}

:deep(.panel-section-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 14px 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

:deep(.panel-section-header:hover) {
  background: rgba(255, 255, 255, 0.02);
}

:deep(.panel-section-body) {
  padding: 4px 14px 12px;
}

.subsection-label {
  font-size: 10px;
  font-weight: 500;
  color: #3D3D52;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.camera-pos-display { padding: 8px 0; }

.coord-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  padding: 3px 6px;
  flex: 1;
}

.coord-axis {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.coord-axis.x { color: #FF6B6B; }
.coord-axis.y { color: #22C55E; }
.coord-axis.z { color: #6C63FF; }

.coord-val {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 10px;
  color: #B0B0CC;
}

.color-swatch-label {
  position: relative;
  cursor: pointer;
}

.color-preview {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: transform 0.1s ease;
}

.color-swatch-label:hover .color-preview {
  transform: scale(1.1);
}

.color-picker-hidden {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  border: none;
  padding: 0;
}

.bg-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.bg-preset-btn {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: transform 0.1s ease;
}

.bg-preset-btn:hover {
  transform: scale(1.15);
}
</style>
