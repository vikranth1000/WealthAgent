/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#111111', // Deep charcoal match for Perplexity
        panel: '#1C1C1E', // Panel surface
        'panel-hover': '#2C2C2E', // Subtle hover elevation
        border: '#2C2C2E', // Thin panel borders
        primary: '#FFFFFF', // Pure white for primary 
        secondary: '#A1A1AA', // Silver/muted for secondary
        danger: '#EF4444',
        success: '#10B981',
        muted: '#71717A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 4px 12px rgba(0, 0, 0, 0.25)', // Crisper, less glaring drop
        'drawer': '0 -10px 40px rgba(0, 0, 0, 0.6)', 
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-left': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.4s ease-out forwards',
        'slide-left': 'slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
