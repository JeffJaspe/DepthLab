export type ImageFileType = 'png' | 'jpg' | 'svg'

export interface ProcessedImage {
  url: string
  originalUrl: string
  type: ImageFileType
  width: number
  height: number
  hasTransparency: boolean
}

export function detectFileType(file: File): ImageFileType {
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) return 'svg'
  if (file.type === 'image/png') return 'png'
  return 'jpg'
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  const type = detectFileType(file)
  const url = URL.createObjectURL(file)

  if (type === 'svg') {
    return { url, originalUrl: url, type: 'svg', width: 512, height: 512, hasTransparency: true }
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        url,
        originalUrl: url,
        type,
        width: img.naturalWidth,
        height: img.naturalHeight,
        hasTransparency: type === 'png'
      })
    }
    img.onerror = () => resolve({ url, originalUrl: url, type, width: 0, height: 0, hasTransparency: false })
    img.src = url
  })
}

function getPixel(data: Uint8ClampedArray, x: number, y: number, width: number) {
  const i = (y * width + x) * 4
  return { r: data[i], g: data[i + 1], b: data[i + 2] }
}

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

export async function removeBackground(imageUrl: string, threshold = 40): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imgData.data
      const w = canvas.width
      const h = canvas.height

      // Sample 4 corners + center edges to determine background color
      const samples = [
        getPixel(d, 0, 0, w),
        getPixel(d, w - 1, 0, w),
        getPixel(d, 0, h - 1, w),
        getPixel(d, w - 1, h - 1, w),
        getPixel(d, Math.floor(w / 2), 0, w),
        getPixel(d, Math.floor(w / 2), h - 1, w),
        getPixel(d, 0, Math.floor(h / 2), w),
        getPixel(d, w - 1, Math.floor(h / 2), w)
      ]

      const bg = {
        r: samples.reduce((s, p) => s + p.r, 0) / samples.length,
        g: samples.reduce((s, p) => s + p.g, 0) / samples.length,
        b: samples.reduce((s, p) => s + p.b, 0) / samples.length
      }

      for (let i = 0; i < d.length; i += 4) {
        const dist = colorDist(d[i], d[i + 1], d[i + 2], bg.r, bg.g, bg.b)
        if (dist < threshold) {
          d[i + 3] = 0
        } else if (dist < threshold * 1.5) {
          // Soft edge feathering
          d[i + 3] = Math.round(((dist - threshold) / (threshold * 0.5)) * 255)
        }
      }

      ctx.putImageData(imgData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load image for bg removal'))
    img.src = imageUrl
  })
}

// Placeholder for remove.bg API — drop in API key to enable
export async function removeBackgroundAPI(_imageUrl: string, _apiKey: string): Promise<string> {
  throw new Error('remove.bg API not configured. Set your API key in settings.')
}
