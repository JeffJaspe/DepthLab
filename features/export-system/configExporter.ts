import type { EmbedConfig } from './embedGenerator'

export function downloadConfigJSON(config: EmbedConfig, filename = 'depthlab-config.json'): void {
  const json = JSON.stringify(config, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
  } else {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

export function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:')
}

export function isDataUrl(url: string): boolean {
  return url.startsWith('data:')
}

export function isHostedUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}
