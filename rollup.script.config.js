const typescript = require('@rollup/plugin-typescript')

module.exports = {
  input: './src/index.ts',
  plugins: [typescript({
    tsconfig: './tsconfig.cjs.json',
    compilerOptions: { module: 'esnext' },
    outputToFilesystem: false
  })],
  output: {
    file: './dist/script/keystrokes.js',
    name: 'keystrokes',
    format: 'iife',
    sourcemap: true,
  }
}
