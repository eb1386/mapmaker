import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // spa fallback
    historyApiFallback: true
  },
  build: {
    chunkSizeWarningLimit: 1500
  },
  appType: 'spa'
})
