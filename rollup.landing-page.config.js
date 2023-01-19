const typescript = require('@rollup/plugin-typescript')

module.exports = {
  input: './src/landing-page/index.ts',
  plugins: [typescript({
    tsconfig: './tsconfig.landing-page.json',
    compilerOptions: { module: 'ESNext' },
    outputToFilesystem: true
  })],
  output: {
    file: './dist/landing-page/index.js',
    name: 'page',
    format: 'iife',
  }
}
