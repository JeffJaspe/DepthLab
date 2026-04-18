<template>
  <EditorLayout />
</template>

<script setup lang="ts">
import EditorLayout from '~/features/editor/EditorLayout.vue'

useHead({ title: 'Editor — DepthLab' })

// Prevent body scroll on editor page
onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>
