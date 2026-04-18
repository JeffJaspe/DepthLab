<template>
  <div class="editor-root">
    <!-- Top Bar -->
    <TopBar />

    <!-- Main area (sidebar + canvas + panel) -->
    <div class="editor-main">
      <!-- Left Sidebar -->
      <LeftSidebar @reset-view="handleResetView" />

      <!-- Center Canvas -->
      <ThreeCanvas ref="canvasRef" />

      <!-- Right Panel -->
      <RightPanel @reset-camera="handleResetCamera" />
    </div>

    <!-- Status Bar -->
    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TopBar from '~/components/editor/TopBar.vue'
import LeftSidebar from '~/components/editor/LeftSidebar.vue'
import RightPanel from '~/components/editor/RightPanel.vue'
import StatusBar from '~/components/editor/StatusBar.vue'
import ThreeCanvas from '~/features/threejs/ThreeCanvas.vue'

const canvasRef = ref<InstanceType<typeof ThreeCanvas> | null>(null)

function handleResetView() {
  canvasRef.value?.resetCamera()
}

function handleResetCamera() {
  canvasRef.value?.resetCamera()
}
</script>

<style scoped>
.editor-root {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0A0A0F;
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
</style>
