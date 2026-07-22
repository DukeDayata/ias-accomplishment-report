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
            DEFAULT: '#0F4C81',
            dark: '#0a3356',
            light: '#e6f0f9',
            accent: '#1a68b0'
          },
          gold: {
            DEFAULT: '#E5A726',
            dark: '#b8861e',
            light: '#fcf6e9'
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
        },
        accent: {
          emerald: '#10B981',
          violet: '#8B5CF6',
          indigo: '#6366F1',
          rose: '#F43F5E',
          cyan: '#06B6D4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
}
