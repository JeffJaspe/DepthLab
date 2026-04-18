export interface EmbedConfig {
  version: string
  imageUrl: string
  scene: {
    metalness: number
    roughness: number
    opacity: number
    wireframe: boolean
    ambientIntensity: number
    directionalIntensity: number
    lightPosition: { x: number; y: number; z: number }
    autoRotate: boolean
    autoRotateSpeed: number
    fov: number
    bgColor: string
  }
}

export function serializeConfig(config: EmbedConfig): string {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(config))))
  } catch {
    return btoa(JSON.stringify(config))
  }
}

export function deserializeConfig(encoded: string): EmbedConfig {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))))
  } catch {
    return JSON.parse(atob(encoded))
  }
}

export function generateIframeEmbed(
  config: EmbedConfig,
  baseUrl: string,
  width = 600,
  height = 400
): string {
  const encoded = serializeConfig(config)
  const url = `${baseUrl}/embed?config=${encoded}`
  return `<iframe
  src="${url}"
  width="${width}"
  height="${height}"
  frameborder="0"
  scrolling="no"
  allow="autoplay"
  style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);"
  title="3D Product Viewer"
></iframe>`
}

export function generateShopifySnippet(
  config: EmbedConfig,
  baseUrl: string,
  width = '100%',
  height = '500px'
): string {
  const encoded = serializeConfig(config)
  const url = `${baseUrl}/embed?config=${encoded}`
  return `{% comment %} DepthLab 3D Viewer {% endcomment %}
<div class="depthlab-viewer" style="width:${width};height:${height};">
  <iframe
    src="${url}"
    width="100%"
    height="100%"
    frameborder="0"
    scrolling="no"
    allow="autoplay"
    style="border-radius:8px;"
    title="{{ product.title }} — 3D View"
  ></iframe>
</div>`
}
