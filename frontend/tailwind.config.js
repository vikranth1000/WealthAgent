/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1B2A4A',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0,0,0,0.20)',
        'glass-sm': '0 2px 8px rgba(0,0,0,0.16)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'divider-draw': {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        'panel-left': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'panel-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'progress-sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'divider-draw': 'divider-draw 0.5s ease-out 0.15s both',
        breathe: 'breathe 2s ease-in-out infinite',
        'panel-left': 'panel-left 0.4s ease-out both',
        'panel-right': 'panel-right 0.4s ease-out 0.35s both',
        'progress-sweep': 'progress-sweep 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
