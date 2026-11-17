/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        canvas: '#F7F4ED',
        surface: '#FFFFFF',
        ink: '#292923',
        forest: {
          DEFAULT: '#263E35',
          800: '#1d3029',
          900: '#15221d',
        },
        terracotta: {
          DEFAULT: '#B95F43',
          600: '#B35A3F',
          700: '#9c4d34',
        },
        gold: '#E5B968',
        line: '#E9E4D9',
        muted: '#D8D0C3',
        'ink-soft': '#77766E',
        success: '#397653',
        warning: '#A86A20',
        danger: '#B7473E',
        info: '#416D91',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'tk-sm': '6px',
        'tk-md': '10px',
        'tk-lg': '16px',
        'tk-xl': '24px',
      },
    },
  },
  plugins: [],
};
