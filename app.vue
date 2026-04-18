<template>
  <div class="dark">
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
useHead({
  htmlAttrs: { class: 'dark' },
  bodyAttrs: { class: 'bg-bg text-text-primary overflow-hidden' }
})
</script>

<style>
/* Ensure the root fills the viewport */
#__nuxt {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
