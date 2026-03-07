import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Build output goes to dist/ — upload this folder's contents to Bluehost public_html/
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
