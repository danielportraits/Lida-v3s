/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { lida: { black: '#0a0a0a', green: '#00ff66', panel: '#101713' } },
    boxShadow: { neon: '0 0 24px rgba(0,255,102,.18)' }
  }},
  plugins: []
};