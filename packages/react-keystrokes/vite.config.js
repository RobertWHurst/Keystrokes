import typescript from '@rollup/plugin-typescript'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'reactKeystrokes',
      fileName: 'react-keystrokes',
    },
    rollupOptions: {
      external: ['@rwh/keystrokes', 'react'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          "@rwh/keystrokes": 'keystrokes',
          react: 'React',
        },
      },
    },
  },
  plugins: [
    typescript({
      exclude: ['**/*.spec.*', '**/*.test.*', '**/tests/**/*'],
    })
  ],
  test: {
    environment: 'happy-dom'
  }
})
