/** @type {import('tailwindcss').Config} */

const nativewindPlugin = require('./nativewind.plugin');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        dough: {
          50: '#fff8e6',
          100: '#fdeeb8',
          200: '#fdde97', // main soft yellow from background
          300: '#fcc861',
          400: '#f4b540',
          500: '#eaa322',
          600: '#cb871b',
          700: '#a46814',
          800: '#7c4c0e',
          900: '#5a3709',
        },
        outline: {
          500: '#632f16', // dark line art color
        },
        orange: {
          400: '#e28731', // main orange
          500: '#c46f24',
        },
        teal: {
          300: '#78c7b9',
          400: '#5daa9c', // blue O pieces
          500: '#4a8f84',
        },
      },
    },
  },
  plugins: [nativewindPlugin],
};
