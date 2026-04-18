<template>
  <button
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium text-sm no-select',
      'rounded transition-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
      sizeClasses,
      variantClasses,
      { 'opacity-40 cursor-not-allowed pointer-events-none': disabled },
      { 'cursor-wait': loading }
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <!-- Loading spinner -->
    <span v-if="loading" class="inline-flex items-center gap-2">
      <svg
        class="animate-spin"
        :class="iconSize"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span v-if="loadingText">{{ loadingText }}</span>
      <slot v-else />
    </span>

    <!-- Normal state -->
    <template v-else>
      <span v-if="$slots.icon" class="shrink-0">
        <slot name="icon" />
      </span>
      <slot />
    </template>
  </button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

interface Props {
  variant?: 'accent' | 'ghost' | 'outline' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'ghost',
  size: 'md',
  disabled: false,
  loading: false
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'h-6 px-2 text-xs rounded'
    case 'sm': return 'h-7 px-3 text-xs rounded'
    case 'md': return 'h-8 px-4 text-sm rounded-md'
    case 'lg': return 'h-10 px-6 text-sm rounded-lg'
    default: return 'h-8 px-4 text-sm rounded-md'
  }
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'xs':
    case 'sm': return 'w-3 h-3'
    default: return 'w-4 h-4'
  }
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'accent':
      return 'btn-accent text-white'
    case 'outline':
      return 'btn-outline text-text-secondary hover:text-text-primary border border-white/15'
    case 'danger':
      return 'bg-error/10 text-error border border-error/30 hover:bg-error/20 transition-fast'
    case 'ghost':
    default:
      return 'btn-ghost text-text-secondary hover:text-text-primary'
  }
})
</script>
