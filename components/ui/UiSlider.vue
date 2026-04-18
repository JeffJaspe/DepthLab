<template>
  <div class="flex flex-col gap-1.5 w-full">
    <!-- Label row -->
    <div class="flex items-center justify-between">
      <label :for="inputId" class="text-xs text-text-muted select-none">{{ label }}</label>
      <span class="value-badge">{{ displayValue }}</span>
    </div>

    <!-- Slider -->
    <input
      :id="inputId"
      type="range"
      class="slider-input"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :style="{ '--slider-percent': sliderPercent }"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: number
  label: string
  min?: number
  max?: number
  step?: number
  decimals?: number
  unit?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 1,
  step: 0.01,
  decimals: 2,
  unit: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const inputId = computed(() => `slider-${props.label.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`)

const displayValue = computed(() => {
  const val = Number(props.modelValue).toFixed(props.decimals)
  return props.unit ? `${val}${props.unit}` : val
})

const sliderPercent = computed(() => {
  const range = props.max - props.min
  if (range === 0) return '0%'
  const pct = ((props.modelValue - props.min) / range) * 100
  return `${Math.max(0, Math.min(100, pct)).toFixed(1)}%`
})

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  const value = parseFloat(target.value)
  // Update CSS custom property for gradient background
  target.style.setProperty('--slider-percent', `${((value - props.min) / (props.max - props.min)) * 100}%`)
  emit('update:modelValue', value)
}
</script>
