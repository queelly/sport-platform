/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Nunito"', '"Manrope"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Manrope"', '"Nunito"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        blue: {
          50: '#E7F8F0',
          100: '#CFECE0',
          200: '#A5DFC7',
          300: '#72CEA9',
          400: '#3EC08D',
          500: '#16B672',
          600: '#16B672',
          700: '#11995E',
          800: '#0D7A4B',
          900: '#0A5C38',
          950: '#063B24',
        },
        brand: {
          50: '#E7F8F0',
          100: '#CFECE0',
          200: '#A5DFC7',
          500: '#16B672',
          600: '#16B672',
          700: '#11995E',
          900: '#0A5C38',
        },
        energy: {
          400: '#72CEA9',
          500: '#16B672',
          600: '#11995E',
        }
      }
    },
  },
  plugins: [],
};
