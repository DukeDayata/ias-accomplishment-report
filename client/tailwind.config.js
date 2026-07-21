/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: {
            DEFAULT: '#0038A8',
            dark: '#002B80',
            light: '#E6EEFF',
            accent: '#0E59F2'
          },
          gold: {
            DEFAULT: '#FFC72C',
            dark: '#D99B00',
            light: '#FEF9E7'
          },
          red: {
            DEFAULT: '#D22630',
            light: '#FCE8E9'
          }
        },
        sidebar: '#0B192C',
        dashboard: {
          bg: '#F8FAFC',
          border: '#E2E8F0'
        },
        status: {
          success: '#15803D',
          warning: '#D97706',
          error: '#B91C1C',
        },
        surface: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
