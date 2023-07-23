import typescript from '@rollup/plugin-typescript'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'keystrokes',
      fileName: 'keystrokes',
    },
  },
  plugins: [
    typescript({
      exclude: ['**/*.spec.*', '**/*.test.*', './src/tests/**/*'],
    }),
  ],
  test: {},
})
