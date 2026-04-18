import { defineStore } from 'pinia'

export interface EditorState {
  projectName: string
  isGenerating: boolean
  isSaved: boolean
  uploadedImageUrl: string | null
  uploadedImageName: string | null
  processedImageUrl: string | null
  bgRemovalEnabled: boolean
  isProcessingBg: boolean
  selectedTool: 'select' | 'move' | 'rotate' | 'scale'
  showExportPanel: boolean
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    projectName: 'Untitled Project',
    isGenerating: false,
    isSaved: true,
    uploadedImageUrl: null,
    uploadedImageName: null,
    processedImageUrl: null,
    bgRemovalEnabled: false,
    isProcessingBg: false,
    selectedTool: 'select',
    showExportPanel: false
  }),

  getters: {
    hasImage: (state) => state.uploadedImageUrl !== null,
    displayName: (state) => state.projectName || 'Untitled Project',
    activeImageUrl: (state) => state.processedImageUrl ?? state.uploadedImageUrl
  },

  actions: {
    setProjectName(name: string) {
      this.projectName = name
      this.isSaved = false
    },

    setGenerating(value: boolean) {
      this.isGenerating = value
    },

    async generate3D() {
      if (this.isGenerating) return
      this.isGenerating = true
      await new Promise((resolve) => setTimeout(resolve, 2800))
      this.isGenerating = false
      this.isSaved = false
    },

    save() {
      this.isSaved = true
    },

    uploadImage(url: string, name: string) {
      if (this.uploadedImageUrl && this.uploadedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.uploadedImageUrl)
      }
      if (this.processedImageUrl && this.processedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.processedImageUrl)
      }
      this.uploadedImageUrl = url
      this.uploadedImageName = name
      this.processedImageUrl = null
      this.isSaved = false
    },

    setProcessedImageUrl(url: string | null) {
      if (this.processedImageUrl && this.processedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.processedImageUrl)
      }
      this.processedImageUrl = url
      this.isSaved = false
    },

    clearImage() {
      if (this.uploadedImageUrl && this.uploadedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.uploadedImageUrl)
      }
      if (this.processedImageUrl && this.processedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.processedImageUrl)
      }
      this.uploadedImageUrl = null
      this.uploadedImageName = null
      this.processedImageUrl = null
    },

    setBgRemovalEnabled(value: boolean) {
      this.bgRemovalEnabled = value
    },

    setProcessingBg(value: boolean) {
      this.isProcessingBg = value
    },

    setTool(tool: EditorState['selectedTool']) {
      this.selectedTool = tool
    },

    openExportPanel() {
      this.showExportPanel = true
    },

    closeExportPanel() {
      this.showExportPanel = false
    }
  }
})
