import typescript from '@rollup/plugin-typescript'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'keystrokes',
      formats: ['es', 'umd', 'iife'],
      fileName: 'keystrokes',
    },
  },
  plugins: [
    typescript({
      exclude: ['**/*.spec.*', '**/*.test.*', '**/tests/**/*'],
    }),
  ],
  test: {
    environment: 'happy-dom'
  },
})
