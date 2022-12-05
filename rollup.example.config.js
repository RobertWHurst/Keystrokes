const typescript = require('@rollup/plugin-typescript')

module.exports = {
  input: './src/example/index.ts',
  plugins: [typescript({
    tsconfig: './tsconfig.example.json',
    compilerOptions: { module: 'ESNext' },
    outputToFilesystem: true
  })],
  output: {
    file: './dist/example/index.js',
    name: 'page',
    format: 'iife',
  }
}
