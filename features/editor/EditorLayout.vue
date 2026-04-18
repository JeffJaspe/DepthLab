<template>
  <div class="editor-root">
    <TopBar />

    <div class="editor-main">
      <LeftSidebar @reset-view="handleResetView" />
      <ThreeCanvas ref="canvasRef" />
      <RightPanel @reset-camera="handleResetCamera" />
    </div>

    <StatusBar />

    <!-- Export modal (rendered via Teleport inside component) -->
    <ExportPanel />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TopBar from '~/components/editor/TopBar.vue'
import LeftSidebar from '~/components/editor/LeftSidebar.vue'
import RightPanel from '~/components/editor/RightPanel.vue'
import StatusBar from '~/components/editor/StatusBar.vue'
import ExportPanel from '~/components/editor/ExportPanel.vue'
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
