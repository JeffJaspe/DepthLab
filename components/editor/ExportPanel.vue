<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-medium"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-medium"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="editorStore.showExportPanel" class="modal-backdrop" @click.self="editorStore.closeExportPanel()">
        <div class="modal-panel">

          <!-- Header -->
          <div class="modal-header">
            <div class="flex items-center gap-2">
              <div class="header-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="#6C63FF" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M2 12V13.5C2 13.78 2.22 14 2.5 14H13.5C13.78 14 14 13.78 14 13.5V12" stroke="#6C63FF" stroke-width="1.4" stroke-linecap="round" />
                </svg>
              </div>
              <div>
                <h2 class="text-sm font-semibold text-text-primary">Export 3D Viewer</h2>
                <p class="text-xs text-text-muted mt-0.5">Embed on Shopify, websites, or landing pages</p>
              </div>
            </div>
            <button class="close-btn" @click="editorStore.closeExportPanel()">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <!-- Image URL warning -->
          <div v-if="isBlobUrl" class="warning-banner">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="shrink-0">
              <path d="M8 2L14 13H2L8 2Z" stroke="#F59E0B" stroke-width="1.3" stroke-linejoin="round" />
              <path d="M8 6V9" stroke="#F59E0B" stroke-width="1.3" stroke-linecap="round" />
              <circle cx="8" cy="11.5" r="0.6" fill="#F59E0B" />
            </svg>
            <p class="text-xs text-amber-400">
              Your image is stored locally. For embeds to work externally, host the image at a public URL and paste it below.
            </p>
          </div>

          <!-- Hosted image URL override -->
          <div v-if="isBlobUrl" class="px-5 pb-2">
            <label class="text-xs text-text-muted block mb-1">Public Image URL (for embeds)</label>
            <input
              v-model="hostedImageUrl"
              type="url"
              placeholder="https://your-cdn.com/product.png"
              class="url-input"
            />
          </div>

          <!-- Tabs -->
          <div class="tabs-row">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-btn"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab: Embed Code (iframe) -->
          <div v-if="activeTab === 'iframe'" class="tab-content">
            <div class="dimension-row">
              <div class="dim-field">
                <label class="text-xs text-text-muted">Width (px)</label>
                <input v-model.number="embedWidth" type="number" min="200" max="1920" class="dim-input" />
              </div>
              <div class="dim-field">
                <label class="text-xs text-text-muted">Height (px)</label>
                <input v-model.number="embedHeight" type="number" min="150" max="1080" class="dim-input" />
              </div>
            </div>

            <div class="code-block">
              <div class="code-header">
                <span class="text-xs text-text-muted">HTML Embed</span>
                <button class="copy-btn" :class="{ copied: copiedTab === 'iframe' }" @click="copyCode('iframe')">
                  <svg v-if="copiedTab !== 'iframe'" width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" />
                    <path d="M3 11H2.5C1.672 11 1 10.328 1 9.5V2.5C1 1.672 1.672 1 2.5 1H9.5C10.328 1 11 1.672 11 2.5V3" stroke="currentColor" stroke-width="1.3" />
                  </svg>
                  <svg v-else width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8L6 12L14 4" stroke="#22C55E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  {{ copiedTab === 'iframe' ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <pre class="code-pre"><code>{{ iframeCode }}</code></pre>
            </div>

            <div class="preview-note">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#6C63FF" stroke-width="1.3" />
                <path d="M8 7V11M8 5.5V5" stroke="#6C63FF" stroke-width="1.3" stroke-linecap="round" />
              </svg>
              <span class="text-xs text-text-muted">Paste this anywhere: Shopify sections, HTML pages, landing pages</span>
            </div>
          </div>

          <!-- Tab: Shopify -->
          <div v-if="activeTab === 'shopify'" class="tab-content">
            <div class="code-block">
              <div class="code-header">
                <span class="text-xs text-text-muted">Shopify Liquid Snippet</span>
                <button class="copy-btn" :class="{ copied: copiedTab === 'shopify' }" @click="copyCode('shopify')">
                  <svg v-if="copiedTab !== 'shopify'" width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3" />
                    <path d="M3 11H2.5C1.672 11 1 10.328 1 9.5V2.5C1 1.672 1.672 1 2.5 1H9.5C10.328 1 11 1.672 11 2.5V3" stroke="currentColor" stroke-width="1.3" />
                  </svg>
                  <svg v-else width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8L6 12L14 4" stroke="#22C55E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  {{ copiedTab === 'shopify' ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <pre class="code-pre"><code>{{ shopifyCode }}</code></pre>
            </div>

            <div class="shopify-steps">
              <p class="text-xs font-medium text-text-secondary mb-2">How to add to Shopify:</p>
              <ol class="space-y-1.5">
                <li v-for="(step, i) in shopifySteps" :key="i" class="flex items-start gap-2">
                  <span class="step-num">{{ i + 1 }}</span>
                  <span class="text-xs text-text-muted">{{ step }}</span>
                </li>
              </ol>
            </div>
          </div>

          <!-- Tab: Config JSON -->
          <div v-if="activeTab === 'config'" class="tab-content">
            <div class="code-block">
              <div class="code-header">
                <span class="text-xs text-text-muted">Config JSON</span>
                <div class="flex gap-2">
                  <button class="copy-btn" :class="{ copied: copiedTab === 'config' }" @click="copyCode('config')">
                    {{ copiedTab === 'config' ? 'Copied!' : 'Copy' }}
                  </button>
                  <button class="copy-btn" @click="downloadConfig">
                    Download
                  </button>
                </div>
              </div>
              <pre class="code-pre"><code>{{ configJson }}</code></pre>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEditorStore } from '~/stores/editorStore'
import { useSceneStore } from '~/stores/sceneStore'
import { generateIframeEmbed, generateShopifySnippet, serializeConfig, type EmbedConfig } from '~/features/export-system/embedGenerator'
import { downloadConfigJSON, copyToClipboard, isBlobUrl as checkBlobUrl } from '~/features/export-system/configExporter'

const editorStore = useEditorStore()
const sceneStore = useSceneStore()

const activeTab = ref<'iframe' | 'shopify' | 'config'>('iframe')
const copiedTab = ref<string | null>(null)
const embedWidth = ref(600)
const embedHeight = ref(400)
const hostedImageUrl = ref('')

const tabs = [
  { id: 'iframe', label: 'Embed (iframe)' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'config', label: 'Config JSON' }
]

const shopifySteps = [
  'Go to Shopify Admin → Online Store → Themes',
  'Click "Edit code" on your active theme',
  'Open or create sections/product-3d-viewer.liquid',
  'Paste the snippet and save',
  'Add the section to your product template'
]

const isBlobUrl = computed(() => {
  const url = editorStore.activeImageUrl
  return url ? checkBlobUrl(url) : false
})

const effectiveImageUrl = computed(() => {
  if (hostedImageUrl.value.trim()) return hostedImageUrl.value.trim()
  return editorStore.activeImageUrl ?? ''
})

function buildConfig(): EmbedConfig {
  return {
    version: '1.0',
    imageUrl: effectiveImageUrl.value,
    scene: {
      metalness: sceneStore.metalness,
      roughness: sceneStore.roughness,
      opacity: sceneStore.opacity,
      wireframe: sceneStore.wireframe,
      ambientIntensity: sceneStore.ambientIntensity,
      directionalIntensity: sceneStore.directionalIntensity,
      lightPosition: { ...sceneStore.lightPosition },
      autoRotate: sceneStore.autoRotate,
      autoRotateSpeed: sceneStore.autoRotateSpeed,
      fov: sceneStore.fov,
      bgColor: sceneStore.bgColor
    }
  }
}

const baseUrl = computed(() => {
  if (typeof window === 'undefined') return 'https://depthlab.vercel.app'
  return window.location.origin
})

const iframeCode = computed(() =>
  generateIframeEmbed(buildConfig(), baseUrl.value, embedWidth.value, embedHeight.value)
)

const shopifyCode = computed(() =>
  generateShopifySnippet(buildConfig(), baseUrl.value)
)

const configJson = computed(() =>
  JSON.stringify(buildConfig(), null, 2)
)

async function copyCode(tab: string) {
  let text = ''
  if (tab === 'iframe') text = iframeCode.value
  else if (tab === 'shopify') text = shopifyCode.value
  else if (tab === 'config') text = configJson.value

  await copyToClipboard(text)
  copiedTab.value = tab
  setTimeout(() => { copiedTab.value = null }, 2000)
}

function downloadConfig() {
  downloadConfigJSON(buildConfig(), `${editorStore.projectName.replace(/\s+/g, '-').toLowerCase()}-config.json`)
}

// Reset copied state when panel opens
watch(() => editorStore.showExportPanel, (val) => {
  if (val) {
    copiedTab.value = null
    hostedImageUrl.value = ''
    activeTab.value = 'iframe'
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-panel {
  width: 100%;
  max-width: 580px;
  max-height: 88vh;
  background: #10101A;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(108, 99, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.header-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(108, 99, 255, 0.12);
  border: 1px solid rgba(108, 99, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #6B6B8A;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #F0F0FF;
}

.warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 12px 20px 4px;
  padding: 10px 12px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
}

.url-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12px;
  color: #F0F0FF;
  outline: none;
  transition: border-color 0.15s ease;
}

.url-input:focus {
  border-color: rgba(108, 99, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.08);
}

.url-input::placeholder {
  color: #3D3D52;
}

.tabs-row {
  display: flex;
  gap: 2px;
  padding: 10px 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.tab-btn {
  padding: 7px 14px;
  font-size: 12px;
  color: #6B6B8A;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 6px 6px 0 0;
  margin-bottom: -1px;
}

.tab-btn:hover {
  color: #B0B0CC;
  background: rgba(255, 255, 255, 0.03);
}

.tab-btn.active {
  color: #6C63FF;
  border-bottom-color: #6C63FF;
  background: rgba(108, 99, 255, 0.05);
}

.tab-content {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.dimension-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.dim-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.dim-input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 7px;
  padding: 6px 10px;
  font-size: 12px;
  color: #F0F0FF;
  outline: none;
  width: 100%;
}

.dim-input:focus {
  border-color: rgba(108, 99, 255, 0.4);
}

.code-block {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.code-pre {
  padding: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11px;
  color: #B0B0CC;
  overflow-x: auto;
  white-space: pre;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.5;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 11px;
  background: rgba(108, 99, 255, 0.1);
  border: 1px solid rgba(108, 99, 255, 0.25);
  border-radius: 5px;
  color: #8B5CF6;
  cursor: pointer;
  transition: all 0.15s ease;
}

.copy-btn:hover {
  background: rgba(108, 99, 255, 0.2);
}

.copy-btn.copied {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #22C55E;
}

.preview-note {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(108, 99, 255, 0.05);
  border: 1px solid rgba(108, 99, 255, 0.1);
  border-radius: 8px;
}

.shopify-steps {
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-top: 12px;
}

.step-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(108, 99, 255, 0.15);
  border: 1px solid rgba(108, 99, 255, 0.3);
  color: #8B5CF6;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
