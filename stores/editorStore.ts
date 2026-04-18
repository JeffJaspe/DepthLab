import { defineStore } from 'pinia'

export interface EditorState {
  projectName: string
  isGenerating: boolean
  isSaved: boolean
  uploadedImageUrl: string | null
  uploadedImageName: string | null
  selectedTool: 'select' | 'move' | 'rotate' | 'scale'
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    projectName: 'Untitled Project',
    isGenerating: false,
    isSaved: true,
    uploadedImageUrl: null,
    uploadedImageName: null,
    selectedTool: 'select'
  }),

  getters: {
    hasImage: (state) => state.uploadedImageUrl !== null,
    displayName: (state) => state.projectName || 'Untitled Project'
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
      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2800))
      this.isGenerating = false
      this.isSaved = false
    },

    save() {
      this.isSaved = true
    },

    uploadImage(url: string, name: string) {
      // Revoke old object URL if exists
      if (this.uploadedImageUrl && this.uploadedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.uploadedImageUrl)
      }
      this.uploadedImageUrl = url
      this.uploadedImageName = name
      this.isSaved = false
    },

    clearImage() {
      if (this.uploadedImageUrl && this.uploadedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.uploadedImageUrl)
      }
      this.uploadedImageUrl = null
      this.uploadedImageName = null
    },

    setTool(tool: EditorState['selectedTool']) {
      this.selectedTool = tool
    }
  }
})
