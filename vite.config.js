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
    cssCodeSplit: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.error'],
        passes: 3,
        unsafe: true,
        unsafe_proto: true
      },
      mangle: {
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false,
        ecma: 2020
      }
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true
      }
    }
  }
}) 