import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/chat-element.js',
      formats: ['es'],
      fileName: 'chat-element'
    },
    cssCodeSplit: false
  }
}) 