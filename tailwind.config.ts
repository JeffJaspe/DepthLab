import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './features/**/*.vue',
    './composables/**/*.{js,ts}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace']
      },
      colors: {
        bg: {
          DEFAULT: '#0A0A0F',
          surface: '#111118',
          elevated: '#1A1A24',
          input: '#16161F'
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          subtle: 'rgba(255,255,255,0.05)',
          active: 'rgba(108,99,255,0.5)'
        },
        accent: {
          DEFAULT: '#6C63FF',
          hover: '#7B74FF',
          secondary: '#FF6B6B',
          purple: '#8B5CF6'
        },
        text: {
          primary: '#F0F0FF',
          secondary: '#B0B0CC',
          muted: '#6B6B8A',
          disabled: '#3D3D52'
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444'
      },
      boxShadow: {
        'accent-glow': '0 0 20px rgba(108,99,255,0.3)',
        'accent-glow-lg': '0 0 40px rgba(108,99,255,0.2)',
        'panel': '0 4px 24px rgba(0,0,0,0.4)',
        'button': '0 2px 8px rgba(0,0,0,0.3)',
        'inset-top': 'inset 0 1px 0 rgba(255,255,255,0.06)'
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        DEFAULT: '12px',
        lg: '20px'
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px'
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)'
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
} satisfies Config
