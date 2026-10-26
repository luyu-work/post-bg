import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // относительные пути, чтобы сайт работал в подпапке GitHub Pages
  base: './',
  plugins: [react()],
})
