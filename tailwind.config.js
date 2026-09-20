/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Chassis — the control-room enclosure
        void: '#07090C',
        surface: '#0E1218',
        panel: '#141A22',
        raised: '#1A212B',
        hairline: '#222B36',
        edge: '#2E3A49',
        // Signal colours
        signal: {
          DEFAULT: '#2F8BFF',
          bright: '#5AA7FF',
          dim: '#1B4E8F',
          wash: 'rgba(47,139,255,0.10)',
        },
        caution: {
          DEFAULT: '#F59E0B',
          dim: '#7A4F05',
          wash: 'rgba(245,158,11,0.10)',
        },
        critical: {
          DEFAULT: '#F04438',
          dim: '#7C231C',
          wash: 'rgba(240,68,56,0.10)',
        },
        nominal: {
          DEFAULT: '#12B5A0',
          dim: '#0A5C52',
          wash: 'rgba(18,181,160,0.10)',
        },
        // Reserved for anything the model refuses to classify
        unknown: {
          DEFAULT: '#8B7BD8',
          dim: '#40357A',
          wash: 'rgba(139,123,216,0.10)',
        },
        ink: {
          DEFAULT: '#E7ECF3',
          muted: '#94A1B2',
          faint: '#64717F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        panel: '4px',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.8)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      animation: {
        'pulse-dot': 'pulseDot 2.4s ease-in-out infinite',
        sweep: 'sweep 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
