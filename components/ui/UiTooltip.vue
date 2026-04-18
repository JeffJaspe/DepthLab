<template>
  <div
    class="relative inline-flex"
    @mouseenter="show"
    @mouseleave="hide"
    @focus="show"
    @blur="hide"
  >
    <slot />

    <Transition
      enter-active-class="transition-fast"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-fast"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isVisible && text"
        class="tooltip-content"
        :class="positionClasses"
        role="tooltip"
      >
        {{ text }}
        <!-- Arrow -->
        <div
          class="absolute w-2 h-2 rotate-45"
          :class="arrowClasses"
          style="background: rgba(26, 26, 36, 0.95); border: 1px solid rgba(255,255,255,0.1);"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  text?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom',
  delay: 400
})

const isVisible = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

function show() {
  if (!props.text) return
  timer = setTimeout(() => { isVisible.value = true }, props.delay)
}

function hide() {
  if (timer) { clearTimeout(timer); timer = null }
  isVisible.value = false
}

const positionClasses = computed(() => {
  switch (props.position) {
    case 'top': return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-2'
    case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-2'
    case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-2'
    default: return 'top-full left-1/2 -translate-x-1/2 mt-2'
  }
})

const arrowClasses = computed(() => {
  switch (props.position) {
    case 'top': return 'top-full left-1/2 -translate-x-1/2 -mt-1'
    case 'bottom': return 'bottom-full left-1/2 -translate-x-1/2 -mb-1'
    case 'left': return 'left-full top-1/2 -translate-y-1/2 -ml-1'
    case 'right': return 'right-full top-1/2 -translate-y-1/2 -mr-1'
    default: return 'bottom-full left-1/2 -translate-x-1/2 -mb-1'
  }
})
</script>
