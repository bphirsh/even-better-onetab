import { defineConfig, type Plugin } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const root = dirname(fileURLToPath(import.meta.url))
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

/**
 * package.json is the single source of truth for the version; this stamps it into
 * the built manifest after publicDir has copied it, so the two can't drift. Bump
 * the version in package.json only.
 */
const stampManifestVersion = (): Plugin => ({
  name: 'stamp-manifest-version',
  closeBundle() {
    const manifestPath = resolve(root, 'dist/manifest.json')
    if (!existsSync(manifestPath)) return
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    manifest.version = version
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  },
})

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  plugins: [svelte(), stampManifestVersion()],
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
