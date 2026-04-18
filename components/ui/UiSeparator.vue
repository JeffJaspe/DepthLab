<template>
  <div
    :class="[
      'shrink-0',
      orientation === 'horizontal'
        ? 'w-full h-px my-1'
        : 'h-full w-px mx-1'
    ]"
    :style="{ background: color }"
    role="separator"
    :aria-orientation="orientation"
  />
</template>

<script setup lang="ts">
interface Props {
  orientation?: 'horizontal' | 'vertical'
  color?: string
}

withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  color: 'rgba(255,255,255,0.06)'
})
</script>
