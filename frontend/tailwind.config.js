/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          red: '#E10600',
          dark: '#0B0D14',
          panel: '#121624',
          carbon: '#181E30',
          border: '#222A42',
          neon: '#00F5D4',
          amber: '#FFB703',
          purple: '#7209B7'
        }
      }
    },
  },
  plugins: [],
}