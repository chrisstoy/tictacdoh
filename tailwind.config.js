/** @type {import('tailwindcss').Config} */

const nativewindPlugin = require('./nativewind.plugin');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#fdde97', // main soft yellow background
        border: '#632f16', // dark line art border
        text: '#2b262c', // darker line art text
        highlight: '#c46f24', // active player highlight background
      },
    },
  },
  plugins: [nativewindPlugin],
};
