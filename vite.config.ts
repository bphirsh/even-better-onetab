import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  plugins: [svelte()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'chrome110',
    // The preload polyfill references `document`, which doesn't exist in the
    // service worker context.
    modulePreload: false,
    rollupOptions: {
      input: {
        popup: resolve(root, 'src/popup.html'),
        app: resolve(root, 'src/app.html'),
        sw: resolve(root, 'src/sw.ts'),
      },
      output: {
        entryFileNames: chunk => (chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
})
