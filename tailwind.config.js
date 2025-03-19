/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        demol: {
          primary: '#E31837',
          secondary: '#1A1A1A',
          accent: '#FFD700',
          'text-primary': '#FFFFFF',
          'text-secondary': '#CCCCCC',
          'text-dark': '#1A1A1A',
          'bg-primary': '#1A1A1A',
          'bg-secondary': '#2A2A2A',
          'bg-light': '#F5F5F5',
          border: '#333333',
          'border-light': '#444444',
          success: '#4CAF50',
          error: '#E31837',
          warning: '#FFC107',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        'demol-xs': '0.25rem',
        'demol-sm': '0.5rem',
        'demol-md': '1rem',
        'demol-lg': '1.5rem',
        'demol-xl': '2rem',
      },
      borderRadius: {
        'demol-sm': '4px',
        'demol-md': '8px',
        'demol-lg': '16px',
      },
      boxShadow: {
        'demol-sm': '0 1px 2px rgba(0, 0, 0, 0.1)',
        'demol-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'demol-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        'demol-fast': '150ms',
        'demol-normal': '250ms',
        'demol-slow': '350ms',
      },
    },
  },
  plugins: [],
} 