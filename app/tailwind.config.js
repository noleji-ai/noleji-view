/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A202C', // Deep Navy
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#10B981', // Emerald Green
          foreground: '#FFFFFF',
        },
        background: '#FFFFFF',
        muted: '#F7FAFC',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'Public Sans', 'sans-serif'],
        serif: ['Source Serif 4', 'serif'],
      },
    },
  },
  plugins: [],
}
