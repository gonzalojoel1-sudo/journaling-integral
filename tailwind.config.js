/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'area-ser': { DEFAULT: '#0ea5e9', light: '#e0f2fe', dark: '#0c4a6e' },
        'area-negocio': { DEFAULT: '#10b981', light: '#d1fae5', dark: '#064e3b' },
        'area-fe': { DEFAULT: '#8b5cf6', light: '#ede9fe', dark: '#3b0764' },
        'area-cuerpo': { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#78350f' },
        'area-mente': { DEFAULT: '#06b6d4', light: '#cffafe', dark: '#164e63' },
        'area-relaciones': { DEFAULT: '#f43f5e', light: '#ffe4e6', dark: '#881337' },
        'area-legado': { DEFAULT: '#f97316', light: '#ffedd5', dark: '#7c2d12' },
        'area-disciplina': { DEFAULT: '#71717a', light: '#f4f4f5', dark: '#27272a' },

        'surface': {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          800: '#1a1a1e',
          850: '#141416',
          900: '#0f0f12',
          950: '#0a0a0b',
        },
      },

      boxShadow: {
        'surface': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'elevated': '0 4px 16px -2px rgba(0,0,0,0.06), 0 2px 6px -1px rgba(0,0,0,0.03)',
        'float': '0 12px 40px -8px rgba(0,0,0,0.1), 0 4px 12px -2px rgba(0,0,0,0.04)',
        'glow-emerald': '0 0 20px -4px rgba(16,185,129,0.2)',
        'glow-sky': '0 0 20px -4px rgba(14,165,233,0.2)',
        'inset-subtle': 'inset 0 1px 0 rgba(255,255,255,0.05)',

        'surface-dark': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'elevated-dark': '0 4px 16px -2px rgba(0,0,0,0.4), 0 2px 6px -1px rgba(0,0,0,0.2)',
        'float-dark': '0 12px 40px -8px rgba(0,0,0,0.5), 0 4px 12px -2px rgba(0,0,0,0.3)',
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },

      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-collapse': {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '2000px', opacity: '1' },
        },
        'slide-expand': {
          '0%': { maxHeight: '2000px', opacity: '1' },
          '100%': { maxHeight: '0', opacity: '0' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'check-mark': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px -2px rgba(16,185,129,0.15)' },
          '50%': { boxShadow: '0 0 16px -2px rgba(16,185,129,0.3)' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-collapse': 'slide-collapse 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-expand': 'slide-expand 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'check-mark': 'check-mark 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },

      fontFamily: {
        'mono': ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
