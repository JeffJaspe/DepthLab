<template>
  <div class="dashboard-root">
    <!-- Animated background canvas -->
    <canvas ref="bgCanvasRef" class="bg-canvas" />

    <!-- Main content -->
    <div class="dashboard-content">
      <!-- Navigation bar -->
      <nav class="dash-nav">
        <div class="flex items-center gap-2">
          <!-- Logo -->
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#dashCubeTop)" />
            <path d="M2 7V17L12 22V12L2 7Z" fill="url(#dashCubeLeft)" />
            <path d="M22 7V17L12 22V12L22 7Z" fill="url(#dashCubeRight)" />
            <defs>
              <linearGradient id="dashCubeTop" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#8B5CF6" />
                <stop offset="100%" stop-color="#6C63FF" />
              </linearGradient>
              <linearGradient id="dashCubeLeft" x1="2" y1="7" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#4C44C4" />
                <stop offset="100%" stop-color="#2A2480" />
              </linearGradient>
              <linearGradient id="dashCubeRight" x1="12" y1="7" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#6C63FF" />
                <stop offset="100%" stop-color="#4C44C4" />
              </linearGradient>
            </defs>
          </svg>
          <span class="text-base font-bold text-text-primary tracking-tight">DepthLab</span>
        </div>

        <div class="flex items-center gap-2">
          <UiButton variant="ghost" size="sm">Docs</UiButton>
          <UiButton variant="ghost" size="sm">Changelog</UiButton>
          <UiButton variant="outline" size="sm">Sign in</UiButton>
        </div>
      </nav>

      <!-- Hero section -->
      <section ref="heroRef" class="hero-section">
        <div class="hero-badge">
          <span class="badge-dot" />
          <span>Now in public beta</span>
        </div>

        <h1 class="hero-title">
          <span class="gradient-text">Convert images</span>
          <br />
          <span class="text-text-primary">to interactive 3D</span>
        </h1>

        <p class="hero-tagline">
          Upload any image and let DepthLab transform it into a fully interactive
          <br class="hidden md:block" />
          three-dimensional scene. No 3D expertise required.
        </p>

        <div class="hero-cta">
          <NuxtLink to="/editor">
            <UiButton variant="accent" size="lg">
              <template #icon>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L18 10L10 18" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M2 10H18" stroke="white" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </template>
              Open Editor
            </UiButton>
          </NuxtLink>

          <UiButton variant="outline" size="lg">
            Watch Demo
            <template #icon>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3" />
                <path d="M6.5 5.5L11 8L6.5 10.5V5.5Z" fill="currentColor" />
              </svg>
            </template>
          </UiButton>
        </div>

        <!-- Stats row -->
        <div class="stats-row">
          <div v-for="stat in stats" :key="stat.label" class="stat-item">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </section>

      <!-- Recent projects -->
      <section class="projects-section">
        <div class="section-header-row">
          <h2 class="section-title">Recent Projects</h2>
          <UiButton variant="ghost" size="xs">View all</UiButton>
        </div>

        <div class="projects-grid">
          <NuxtLink
            v-for="project in recentProjects"
            :key="project.id"
            to="/editor"
            class="project-card group"
          >
            <!-- Preview -->
            <div class="project-preview" :style="{ background: project.gradient }">
              <!-- Fake 3D grid lines on preview -->
              <div class="preview-grid" />
              <div class="preview-badge">3D</div>
            </div>

            <!-- Card body -->
            <div class="project-body">
              <div class="flex items-center justify-between">
                <h3 class="project-name">{{ project.name }}</h3>
                <span class="project-arrow opacity-0 group-hover:opacity-100 transition-fast">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
              <div class="flex items-center justify-between mt-1">
                <span class="project-date">{{ project.date }}</span>
                <span class="project-tag">{{ project.tag }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const bgCanvasRef = ref<HTMLCanvasElement | null>(null)
const heroRef = ref<HTMLElement | null>(null)

// Stats
const stats = [
  { value: '2K+', label: 'Active users' },
  { value: '50ms', label: 'Avg. processing' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'Rating' }
]

// Recent projects (mock data)
const recentProjects = [
  {
    id: 1,
    name: 'Mountain Terrain',
    date: '2 hours ago',
    tag: 'Landscape',
    gradient: 'linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #6C63FF 100%)'
  },
  {
    id: 2,
    name: 'Product Shot v2',
    date: 'Yesterday',
    tag: 'Product',
    gradient: 'linear-gradient(135deg, #1a0a0a 0%, #4a1010 50%, #FF6B6B 100%)'
  },
  {
    id: 3,
    name: 'Logo 3D Render',
    date: '3 days ago',
    tag: 'Branding',
    gradient: 'linear-gradient(135deg, #0a1a10 0%, #0d4020 50%, #22C55E 100%)'
  }
]

// Animated particle background
let animFrameId: number | null = null

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
}

function initParticles() {
  const canvas = bgCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const colors = ['rgba(108,99,255,', 'rgba(139,92,246,', 'rgba(255,107,107,']
  const particles: Particle[] = []

  function resize() {
    canvas!.width = window.innerWidth
    canvas!.height = window.innerHeight
  }

  resize()
  window.addEventListener('resize', resize)

  // Create particles
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.4 + 0.05,
      color: colors[Math.floor(Math.random() * colors.length)]
    })
  }

  function draw() {
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw connections
    particles.forEach((p, i) => {
      particles.slice(i + 1).forEach((p2) => {
        const dx = p.x - p2.x
        const dy = p.y - p2.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 120) {
          const opacity = (1 - dist / 120) * 0.12
          ctx.beginPath()
          ctx.strokeStyle = `rgba(108,99,255,${opacity})`
          ctx.lineWidth = 0.5
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      })

      // Draw particle
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `${p.color}${p.alpha})`
      ctx.fill()

      // Move
      p.x += p.vx
      p.y += p.vy

      // Wrap around
      if (p.x < 0) p.x = canvas.width
      if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height
      if (p.y > canvas.height) p.y = 0
    })

    animFrameId = requestAnimationFrame(draw)
  }

  draw()
}

// GSAP hero entrance animation
async function animateHero() {
  if (!heroRef.value) return
  try {
    const { gsap } = await import('gsap')

    const elements = heroRef.value.querySelectorAll('.hero-badge, .hero-title, .hero-tagline, .hero-cta, .stats-row')

    gsap.fromTo(
      elements,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.1
      }
    )
  } catch {}
}

onMounted(() => {
  initParticles()
  animateHero()
})

onUnmounted(() => {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
  }
})

useHead({ title: 'DepthLab — Convert images to interactive 3D' })
</script>

<style scoped>
.dashboard-root {
  width: 100vw;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: #0A0A0F;
  position: relative;
}

.bg-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.dashboard-content {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Navigation */
.dash-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 0;
}

/* Hero */
.hero-section {
  padding: 80px 0 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(108, 99, 255, 0.1);
  border: 1px solid rgba(108, 99, 255, 0.25);
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 12px;
  color: #8B5CF6;
  font-weight: 500;
  margin-bottom: 28px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6C63FF;
  box-shadow: 0 0 8px rgba(108, 99, 255, 0.6);
  animation: pulse-subtle 2s ease-in-out infinite;
}

.hero-title {
  font-size: clamp(40px, 6vw, 68px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 20px;
}

.hero-tagline {
  font-size: 16px;
  color: #6B6B8A;
  line-height: 1.7;
  max-width: 520px;
  margin-bottom: 36px;
}

.hero-cta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 56px;
}

/* Stats row */
.stats-row {
  display: flex;
  gap: 0;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(17, 17, 24, 0.5);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 32px;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  gap: 4px;
}

.stat-item:last-child {
  border-right: none;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #F0F0FF;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 11px;
  color: #6B6B8A;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Projects section */
.projects-section {
  padding-bottom: 80px;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #F0F0FF;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}

.project-card {
  display: block;
  background: rgba(17, 17, 24, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  text-decoration: none;
}

.project-card:hover {
  border-color: rgba(108, 99, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(108, 99, 255, 0.1);
}

.project-preview {
  height: 130px;
  position: relative;
  overflow: hidden;
}

.preview-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
}

.preview-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.05em;
}

.project-body {
  padding: 12px 14px;
}

.project-name {
  font-size: 13px;
  font-weight: 500;
  color: #B0B0CC;
  transition: color 0.15s ease;
}

.project-card:hover .project-name {
  color: #F0F0FF;
}

.project-date {
  font-size: 11px;
  color: #6B6B8A;
}

.project-tag {
  font-size: 10px;
  font-weight: 500;
  color: #6C63FF;
  background: rgba(108, 99, 255, 0.1);
  border: 1px solid rgba(108, 99, 255, 0.2);
  border-radius: 4px;
  padding: 1px 6px;
}

.project-arrow {
  color: #6C63FF;
}
</style>
