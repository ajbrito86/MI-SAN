/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        marca: {
          verde: '#168A5B',
          azul: '#2364AA',
          fondo: '#F7FAF8',
          texto: '#17231F',
        },
      },
    },
  },
  plugins: [],
};
