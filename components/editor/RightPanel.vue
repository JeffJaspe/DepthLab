<template>
  <aside class="right-panel">
    <div class="panel-content">

      <!-- ─── GEOMETRY ──────────────────────────────────────── -->
      <PanelSection title="Geometry" icon="geometry" :open="true">
        <div class="space-y-3">
          <UiSlider
            label="Thickness"
            :model-value="sceneStore.thickness"
            :min="0" :max="0.6" :step="0.01" :decimals="2"
            @update:model-value="sceneStore.setThickness($event)"
          />
          <p class="hint-text">Adds depth/extrusion to the image</p>
        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── TRANSFORM ──────────────────────────────────────── -->
      <PanelSection title="Transform" icon="transform" :open="true">
        <div class="space-y-3">
          <div class="subsection-label">Position</div>
          <UiSlider label="X" :model-value="sceneStore.position.x" :min="-5" :max="5" :step="0.01" :decimals="2" @update:model-value="sceneStore.setPosition('x', $event)" />
          <UiSlider label="Y" :model-value="sceneStore.position.y" :min="-5" :max="5" :step="0.01" :decimals="2" @update:model-value="sceneStore.setPosition('y', $event)" />
          <UiSlider label="Z" :model-value="sceneStore.position.z" :min="-5" :max="5" :step="0.01" :decimals="2" @update:model-value="sceneStore.setPosition('z', $event)" />
          <UiSeparator class="!my-2" />
          <div class="subsection-label">Rotation (rad)</div>
          <UiSlider label="X" :model-value="sceneStore.rotation.x" :min="-3.14159" :max="3.14159" :step="0.01" :decimals="1" unit="°" @update:model-value="sceneStore.setRotation('x', $event)" />
          <UiSlider label="Y" :model-value="sceneStore.rotation.y" :min="-3.14159" :max="3.14159" :step="0.01" :decimals="1" unit="°" @update:model-value="sceneStore.setRotation('y', $event)" />
          <UiSlider label="Z" :model-value="sceneStore.rotation.z" :min="-3.14159" :max="3.14159" :step="0.01" :decimals="1" unit="°" @update:model-value="sceneStore.setRotation('z', $event)" />
          <UiSeparator class="!my-2" />
          <UiSlider label="Scale" :model-value="sceneStore.scale" :min="0.1" :max="3" :step="0.01" :decimals="2" @update:model-value="sceneStore.setScale($event)" />
        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── MATERIAL ──────────────────────────────────────── -->
      <PanelSection title="Material" icon="material" :open="true">
        <div class="space-y-3">

          <!-- Presets -->
          <div class="subsection-label">Presets</div>
          <div class="preset-chips">
            <button
              v-for="p in materialPresets"
              :key="p.id"
              class="preset-chip"
              :class="{ active: sceneStore.materialPreset === p.id }"
              @click="sceneStore.applyMaterialPreset(p.id)"
            >
              {{ p.label }}
            </button>
          </div>

          <UiSeparator class="!my-2" />

          <!-- Color tint -->
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-muted">Color Tint</span>
            <label class="color-swatch-label">
              <div class="color-preview" :style="{ background: sceneStore.colorTint }" />
              <input type="color" :value="sceneStore.colorTint" class="color-picker-hidden"
                @input="sceneStore.setColorTint(($event.target as HTMLInputElement).value)" />
            </label>
          </div>

          <UiSlider label="Metalness"    :model-value="sceneStore.metalness"    :min="0" :max="1" :step="0.01" :decimals="2" @update:model-value="sceneStore.setMetalness($event)" />
          <UiSlider label="Roughness"    :model-value="sceneStore.roughness"    :min="0" :max="1" :step="0.01" :decimals="2" @update:model-value="sceneStore.setRoughness($event)" />
          <UiSlider label="Reflectivity" :model-value="sceneStore.reflectivity" :min="0" :max="1" :step="0.01" :decimals="2" @update:model-value="sceneStore.setReflectivity($event)" />
          <UiSlider label="Opacity"      :model-value="sceneStore.opacity"      :min="0" :max="1" :step="0.01" :decimals="2" @update:model-value="sceneStore.setOpacity($event)" />

          <UiSeparator class="!my-2" />
          <ToggleRow label="Wireframe" :value="sceneStore.wireframe" @toggle="sceneStore.setWireframe(!sceneStore.wireframe)" />
        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── STROKE ────────────────────────────────────────── -->
      <PanelSection title="Stroke" icon="stroke" :open="false">
        <div class="space-y-3">
          <ToggleRow label="Enable Outline" :value="sceneStore.outlineEnabled" @toggle="sceneStore.setOutlineEnabled(!sceneStore.outlineEnabled)" />

          <template v-if="sceneStore.outlineEnabled">
            <div class="flex items-center justify-between">
              <span class="text-xs text-text-muted">Stroke Color</span>
              <label class="color-swatch-label">
                <div class="color-preview" :style="{ background: sceneStore.outlineColor }" />
                <input type="color" :value="sceneStore.outlineColor" class="color-picker-hidden"
                  @input="sceneStore.setOutlineColor(($event.target as HTMLInputElement).value)" />
              </label>
            </div>
            <UiSlider
              label="Thickness"
              :model-value="sceneStore.outlineThickness"
              :min="0.01" :max="0.2" :step="0.005" :decimals="3"
              @update:model-value="sceneStore.setOutlineThickness($event)"
            />
          </template>
        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── EFFECTS ───────────────────────────────────────── -->
      <PanelSection title="Effects" icon="effects" :open="false">
        <div class="space-y-4">

          <!-- Fire -->
          <div class="effect-block">
            <div class="effect-header">
              <div class="flex items-center gap-2">
                <span class="effect-emoji">🔥</span>
                <span class="text-xs text-text-secondary font-medium">Fire</span>
              </div>
              <ToggleRow :value="sceneStore.fireEnabled" @toggle="sceneStore.setFireEnabled(!sceneStore.fireEnabled)" inline />
            </div>
            <UiSlider v-if="sceneStore.fireEnabled"
              label="Intensity"
              :model-value="sceneStore.fireIntensity"
              :min="0.1" :max="1" :step="0.05" :decimals="2"
              @update:model-value="sceneStore.setFireIntensity($event)"
            />
          </div>

          <!-- Water -->
          <div class="effect-block">
            <div class="effect-header">
              <div class="flex items-center gap-2">
                <span class="effect-emoji">🌊</span>
                <span class="text-xs text-text-secondary font-medium">Water</span>
              </div>
              <ToggleRow :value="sceneStore.waterEnabled" @toggle="sceneStore.setWaterEnabled(!sceneStore.waterEnabled)" inline />
            </div>
            <UiSlider v-if="sceneStore.waterEnabled"
              label="Intensity"
              :model-value="sceneStore.waterIntensity"
              :min="0.1" :max="1" :step="0.05" :decimals="2"
              @update:model-value="sceneStore.setWaterIntensity($event)"
            />
          </div>

          <!-- Wind -->
          <div class="effect-block">
            <div class="effect-header">
              <div class="flex items-center gap-2">
                <span class="effect-emoji">🌬</span>
                <span class="text-xs text-text-secondary font-medium">Wind</span>
              </div>
              <ToggleRow :value="sceneStore.windEnabled" @toggle="sceneStore.setWindEnabled(!sceneStore.windEnabled)" inline />
            </div>
            <UiSlider v-if="sceneStore.windEnabled"
              label="Intensity"
              :model-value="sceneStore.windIntensity"
              :min="0.1" :max="1" :step="0.05" :decimals="2"
              @update:model-value="sceneStore.setWindIntensity($event)"
            />
          </div>

        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── ANIMATION ─────────────────────────────────────── -->
      <PanelSection title="Animation" icon="animation" :open="false">
        <div class="space-y-3">

          <!-- Preset picker -->
          <div class="subsection-label">Preset</div>
          <div class="anim-preset-grid">
            <button
              v-for="p in animPresets"
              :key="p.id"
              class="anim-chip"
              :class="{ active: sceneStore.animationPreset === p.id }"
              @click="sceneStore.setAnimationPreset(p.id)"
            >
              <span class="anim-chip-icon">{{ p.icon }}</span>
              <span>{{ p.label }}</span>
            </button>
          </div>

          <!-- Enable + Reset row -->
          <div class="flex items-center justify-between mt-1">
            <ToggleRow
              label="Enable"
              :value="sceneStore.animationEnabled"
              @toggle="sceneStore.setAnimationEnabled(!sceneStore.animationEnabled)"
            />
            <button
              class="anim-reset-btn"
              @click="sceneStore.setAnimationPreset('none'); sceneStore.setAnimationEnabled(false)"
            >Reset</button>
          </div>

          <!-- ── Per-preset params ───────────────────────────── -->
          <template v-if="sceneStore.animationEnabled && sceneStore.animationPreset !== 'none'">
            <UiSeparator class="!my-2" />

            <!-- Float -->
            <template v-if="sceneStore.animationPreset === 'float'">
              <UiSlider label="Amplitude" :model-value="sceneStore.animFloat.amplitude"
                :min="0.1" :max="2" :step="0.05" :decimals="2"
                @update:model-value="sceneStore.animFloat.amplitude = $event" />
              <UiSlider label="Speed" :model-value="sceneStore.animFloat.speed"
                :min="0.1" :max="3" :step="0.1" :decimals="1"
                @update:model-value="sceneStore.animFloat.speed = $event" />
            </template>

            <!-- Rotate -->
            <template v-if="sceneStore.animationPreset === 'rotate'">
              <UiSlider label="Speed" :model-value="sceneStore.animRotate.speed"
                :min="0.1" :max="5" :step="0.1" :decimals="1"
                @update:model-value="sceneStore.animRotate.speed = $event" />
              <div class="anim-axis-row">
                <span class="text-xs text-text-muted">Axis</span>
                <div class="flex gap-2">
                  <button class="axis-btn" :class="{ active: sceneStore.animRotate.axisX }" @click="sceneStore.animRotate.axisX = !sceneStore.animRotate.axisX">X</button>
                  <button class="axis-btn" :class="{ active: sceneStore.animRotate.axisY }" @click="sceneStore.animRotate.axisY = !sceneStore.animRotate.axisY">Y</button>
                  <button class="axis-btn" :class="{ active: sceneStore.animRotate.axisZ }" @click="sceneStore.animRotate.axisZ = !sceneStore.animRotate.axisZ">Z</button>
                </div>
              </div>
            </template>

            <!-- Dissolve -->
            <template v-if="sceneStore.animationPreset === 'dissolve'">
              <ToggleRow label="Loop" :value="sceneStore.animDissolve.looping"
                @toggle="sceneStore.animDissolve.looping = !sceneStore.animDissolve.looping" />
              <UiSlider v-if="!sceneStore.animDissolve.looping"
                label="Amount" :model-value="sceneStore.animDissolve.amount"
                :min="0" :max="1" :step="0.01" :decimals="2"
                @update:model-value="sceneStore.animDissolve.amount = $event" />
              <UiSlider v-if="sceneStore.animDissolve.looping"
                label="Speed" :model-value="sceneStore.animDissolve.speed"
                :min="0.05" :max="1" :step="0.05" :decimals="2"
                @update:model-value="sceneStore.animDissolve.speed = $event" />
              <UiSlider label="Edge Glow" :model-value="sceneStore.animDissolve.edgeGlow"
                :min="0" :max="1" :step="0.05" :decimals="2"
                @update:model-value="sceneStore.animDissolve.edgeGlow = $event" />
            </template>

            <!-- Explode -->
            <template v-if="sceneStore.animationPreset === 'explode'">
              <UiSlider label="Force" :model-value="sceneStore.animExplode.force"
                :min="0.1" :max="3" :step="0.1" :decimals="1"
                @update:model-value="sceneStore.animExplode.force = $event" />
              <UiSlider label="Spread" :model-value="sceneStore.animExplode.spread"
                :min="0.2" :max="4" :step="0.1" :decimals="1"
                @update:model-value="sceneStore.animExplode.spread = $event" />
              <UiSlider label="Chunk Size" :model-value="sceneStore.animExplode.chunkSize"
                :min="1" :max="30" :step="1" :decimals="0"
                @update:model-value="sceneStore.animExplode.chunkSize = $event" />
              <UiSlider label="Scatter" :model-value="sceneStore.animExplode.scatter"
                :min="0" :max="1" :step="0.05" :decimals="2"
                @update:model-value="sceneStore.animExplode.scatter = $event" />
            </template>

            <!-- Wave -->
            <template v-if="sceneStore.animationPreset === 'wave'">
              <UiSlider label="Frequency" :model-value="sceneStore.animWave.frequency"
                :min="0.5" :max="8" :step="0.25" :decimals="2"
                @update:model-value="sceneStore.animWave.frequency = $event" />
              <UiSlider label="Amplitude" :model-value="sceneStore.animWave.amplitude"
                :min="0.1" :max="2" :step="0.05" :decimals="2"
                @update:model-value="sceneStore.animWave.amplitude = $event" />
            </template>

            <!-- Pulse -->
            <template v-if="sceneStore.animationPreset === 'pulse'">
              <UiSlider label="Intensity" :model-value="sceneStore.animPulse.intensity"
                :min="0.02" :max="0.5" :step="0.01" :decimals="2"
                @update:model-value="sceneStore.animPulse.intensity = $event" />
              <UiSlider label="Speed" :model-value="sceneStore.animPulse.speed"
                :min="0.2" :max="4" :step="0.1" :decimals="1"
                @update:model-value="sceneStore.animPulse.speed = $event" />
            </template>

            <!-- Glow -->
            <template v-if="sceneStore.animationPreset === 'glow'">
              <div class="flex items-center justify-between">
                <span class="text-xs text-text-muted">Glow Color</span>
                <label class="color-swatch-label">
                  <div class="color-preview" :style="{ background: sceneStore.animGlow.color }" />
                  <input type="color" :value="sceneStore.animGlow.color" class="color-picker-hidden"
                    @input="sceneStore.animGlow.color = ($event.target as HTMLInputElement).value" />
                </label>
              </div>
              <UiSlider label="Intensity" :model-value="sceneStore.animGlow.intensity"
                :min="0.05" :max="1" :step="0.05" :decimals="2"
                @update:model-value="sceneStore.animGlow.intensity = $event" />
              <UiSlider label="Speed" :model-value="sceneStore.animGlow.speed"
                :min="0.2" :max="4" :step="0.1" :decimals="1"
                @update:model-value="sceneStore.animGlow.speed = $event" />
            </template>
          </template>

          <UiSeparator class="!my-2" />

          <!-- ── Basic (legacy) ─────────────────────────────── -->
          <div class="subsection-label">Basic</div>

          <ToggleRow label="Auto Rotate" :value="sceneStore.autoRotate" @toggle="sceneStore.setAutoRotate(!sceneStore.autoRotate)" />
          <UiSlider v-if="sceneStore.autoRotate"
            label="Speed" :model-value="sceneStore.autoRotateSpeed"
            :min="0.1" :max="5" :step="0.1" :decimals="1"
            @update:model-value="sceneStore.setAutoRotateSpeed($event)"
          />

          <ToggleRow label="Float" :value="sceneStore.floatEnabled" @toggle="sceneStore.setFloatEnabled(!sceneStore.floatEnabled)" />
          <UiSlider v-if="sceneStore.floatEnabled"
            label="Intensity" :model-value="sceneStore.floatIntensity"
            :min="0.1" :max="2" :step="0.1" :decimals="1"
            @update:model-value="sceneStore.setFloatIntensity($event)"
          />

          <ToggleRow label="Hover Reaction" :value="sceneStore.hoverEnabled" @toggle="sceneStore.setHoverEnabled(!sceneStore.hoverEnabled)" />
          <p v-if="sceneStore.hoverEnabled" class="hint-text">Object tilts toward cursor</p>

        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── LIGHTING ──────────────────────────────────────── -->
      <PanelSection title="Lighting" icon="lighting" :open="false">
        <div class="space-y-3">
          <UiSlider label="Ambient"     :model-value="sceneStore.ambientIntensity"     :min="0" :max="2" :step="0.01" :decimals="2" @update:model-value="sceneStore.setAmbientIntensity($event)" />
          <UiSlider label="Directional" :model-value="sceneStore.directionalIntensity" :min="0" :max="3" :step="0.01" :decimals="2" @update:model-value="sceneStore.setDirectionalIntensity($event)" />
          <UiSeparator class="!my-2" />
          <div class="subsection-label">Light Position</div>
          <UiSlider label="X" :model-value="sceneStore.lightPosition.x" :min="-10" :max="10" :step="0.1" :decimals="1" @update:model-value="sceneStore.setLightPosition('x', $event)" />
          <UiSlider label="Y" :model-value="sceneStore.lightPosition.y" :min="-10" :max="10" :step="0.1" :decimals="1" @update:model-value="sceneStore.setLightPosition('y', $event)" />
          <UiSlider label="Z" :model-value="sceneStore.lightPosition.z" :min="-10" :max="10" :step="0.1" :decimals="1" @update:model-value="sceneStore.setLightPosition('z', $event)" />
        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── SCENE ──────────────────────────────────────────── -->
      <PanelSection title="Scene" icon="scene" :open="false">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-muted">Background</span>
            <label class="color-swatch-label">
              <div class="color-preview" :style="{ background: sceneStore.bgColor }" />
              <input type="color" :value="sceneStore.bgColor" class="color-picker-hidden"
                @input="sceneStore.setBgColor(($event.target as HTMLInputElement).value)" />
            </label>
          </div>
          <div class="bg-presets">
            <button v-for="p in bgPresets" :key="p"
              class="bg-preset-btn"
              :style="{ background: p }"
              :class="{ 'ring-1 ring-accent/60': sceneStore.bgColor === p }"
              @click="sceneStore.setBgColor(p)"
            />
          </div>
        </div>
      </PanelSection>

      <UiSeparator />

      <!-- ─── CAMERA ────────────────────────────────────────── -->
      <PanelSection title="Camera" icon="camera" :open="false">
        <div class="space-y-3">
          <UiSlider label="Field of View" :model-value="sceneStore.fov" :min="30" :max="120" :step="1" :decimals="0" unit="°" @update:model-value="sceneStore.setFov($event)" />
          <UiSeparator class="!my-2" />
          <div class="camera-pos-display">
            <span class="text-xs text-text-muted">Camera</span>
            <div class="flex gap-2 mt-1">
              <div class="coord-chip"><span class="coord-axis x">X</span><span class="coord-val">{{ fmt(sceneStore.cameraPosition.x) }}</span></div>
              <div class="coord-chip"><span class="coord-axis y">Y</span><span class="coord-val">{{ fmt(sceneStore.cameraPosition.y) }}</span></div>
              <div class="coord-chip"><span class="coord-axis z">Z</span><span class="coord-val">{{ fmt(sceneStore.cameraPosition.z) }}</span></div>
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

const materialPresets = [
  { id: 'plastic', label: 'Plastic' },
  { id: 'metal',   label: 'Metal'   },
  { id: 'glass',   label: 'Glass'   },
  { id: 'matte',   label: 'Matte'   },
  { id: 'glossy',  label: 'Glossy'  }
]

const animPresets = [
  { id: 'none',    label: 'None',    icon: '○' },
  { id: 'float',   label: 'Float',   icon: '↕' },
  { id: 'rotate',  label: 'Rotate',  icon: '↻' },
  { id: 'dissolve',label: 'Dissolve',icon: '◌' },
  { id: 'explode', label: 'Explode', icon: '✦' },
  { id: 'wave',    label: 'Wave',    icon: '≋' },
  { id: 'pulse',   label: 'Pulse',   icon: '◎' },
  { id: 'glow',    label: 'Glow',    icon: '✧' },
]

const bgPresets = ['#0A0A0F', '#FFFFFF', '#F5F5F0', '#1A1A2E', '#0D1B2A', '#2D1B3D']

function fmt(v: number): string { return v.toFixed(1) }
</script>

<!-- ─── Inline sub-components ───────────────────────────── -->
<script lang="ts">
import { defineComponent, h, ref } from 'vue'

// ToggleRow — reusable toggle with optional inline layout
export const ToggleRow = defineComponent({
  name: 'ToggleRow',
  props: {
    label: { type: String, default: '' },
    value: { type: Boolean, required: true },
    inline: { type: Boolean, default: false }
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    const track = () => h('div', {
      class: ['toggle-track', props.value ? 'active' : ''],
    }, [h('div', { class: ['toggle-thumb', props.value ? 'active' : ''] })])

    return () => h('div', {
      class: props.inline ? '' : 'flex items-center justify-between'
    }, [
      props.label ? h('span', { class: 'text-xs text-text-secondary select-none' }, props.label) : null,
      h('label', {
        class: 'toggle-switch cursor-pointer',
        onClick: (e: Event) => { e.preventDefault(); emit('toggle') }
      }, [track()])
    ])
  }
})

// PanelSection — collapsible section with open prop
export const PanelSection = defineComponent({
  name: 'PanelSection',
  props: {
    title:  { type: String,  required: true },
    icon:   { type: String,  default: '' },
    open:   { type: Boolean, default: true }
  },
  setup(props, { slots }) {
    const isOpen = ref(props.open)

    const iconPaths: Record<string, string> = {
      geometry:  'M8 2L14 5V11L8 14L2 11V5L8 2Z',
      transform: 'M8 1L14 4V12L8 15L2 12V4L8 1Z',
      material:  'M2 6h12M2 10h12M6 2v12M10 2v12',
      stroke:    'M3 13L13 3M3 3l10 10',
      effects:   'M8 1l1.5 4.5H14L10 8.5l1.5 4.5L8 10.5 4.5 13 6 8.5 2 5.5h4.5L8 1Z',
      animation: 'M14 8C14 11.314 11.314 14 8 14C4.686 14 2 11.314 2 8C2 4.686 4.686 2 8 2M8 2L12 2L12 6',
      lighting:  'M8 2a5 5 0 0 1 5 5c0 2.5-1.5 4.5-4 5.4V14H7v-1.6C4.5 11.5 3 9.5 3 7a5 5 0 0 1 5-5z',
      scene:     'M2 12L8 4L14 12H2Z',
      camera:    'M2 5h3l2-2h6l2 2h1v8H2V5z M8 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'
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

.hint-text {
  font-size: 10px;
  color: #3D3D52;
  line-height: 1.4;
}

/* ── Material presets ─── */
.preset-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.preset-chip {
  padding: 3px 10px;
  font-size: 11px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #6B6B8A;
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
}

.preset-chip:hover {
  border-color: rgba(108, 99, 255, 0.3);
  color: #B0B0CC;
}

.preset-chip.active {
  background: rgba(108, 99, 255, 0.18);
  border-color: rgba(108, 99, 255, 0.5);
  color: #8B5CF6;
}

/* ── Color picker ─── */
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

/* ── Effects ─── */
.effect-block {
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.effect-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.effect-emoji {
  font-size: 14px;
  line-height: 1;
}

/* ── Camera ─── */
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

.coord-axis { font-size: 10px; font-weight: 700; letter-spacing: 0.05em; }
.coord-axis.x { color: #FF6B6B; }
.coord-axis.y { color: #22C55E; }
.coord-axis.z { color: #6C63FF; }

.coord-val {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 10px;
  color: #B0B0CC;
}

/* ── Scene presets ─── */
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

.bg-preset-btn:hover { transform: scale(1.15); }

/* ── Animation presets ─── */
.anim-preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.anim-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 5px 4px;
  font-size: 10px;
  border-radius: 7px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
  color: #6B6B8A;
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
  line-height: 1.2;
}

.anim-chip-icon {
  font-size: 13px;
  line-height: 1;
}

.anim-chip:hover {
  border-color: rgba(108,99,255,0.3);
  color: #B0B0CC;
}

.anim-chip.active {
  background: rgba(108,99,255,0.2);
  border-color: rgba(108,99,255,0.55);
  color: #9B8FF7;
}

.anim-reset-btn {
  font-size: 10px;
  color: #6B6B8A;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 5px;
  padding: 3px 10px;
  cursor: pointer;
  transition: all 0.12s ease;
}
.anim-reset-btn:hover {
  color: #B0B0CC;
  border-color: rgba(255,255,255,0.15);
}

.anim-axis-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.axis-btn {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #6B6B8A;
  cursor: pointer;
  transition: all 0.1s ease;
}
.axis-btn.active {
  background: rgba(108,99,255,0.22);
  border-color: rgba(108,99,255,0.5);
  color: #9B8FF7;
}
.axis-btn:hover:not(.active) {
  border-color: rgba(108,99,255,0.25);
  color: #B0B0CC;
}
</style>
