import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['upmovies-dl.js'],
  format: ['esm'],
  clean: true,
  minify: true,
  platform: "node",
  target: 'esnext',
  //Always bundle modules matching given patterns
  noExternal: ['cheerio'],
  skipNodeModulesBundle: true,
})
