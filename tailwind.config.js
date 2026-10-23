/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oriental: {
          gold: '#FFD700',
          red: '#8B0000',
          crimson: '#DC143C',
          darkRed: '#4A0E17',
          jade: '#00A86B',
          royalBlue: '#1B263B'
        }
      }
    },
  },
  plugins: [],
}
