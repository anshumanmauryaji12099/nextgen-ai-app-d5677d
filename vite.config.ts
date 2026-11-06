import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'

// One version string per build. It is baked into the app and the service
// worker so the client can tell when a new deploy is available.
const BUILD_VERSION = new Date()
  .toISOString()
  .replace(/[-:T]/g, '')
  .slice(0, 12)

/** Emits /sw.js into the client build with the version and hashed asset list. */
function nextgenServiceWorker(): Plugin {
  return {
    name: 'nextgen-service-worker',
    apply: 'build',
    applyToEnvironment: (env) => env.config.consumer === 'client',
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((file) => /\.(js|css|woff2?)$/.test(file))
        .map((file) => `/${file}`)
      const source = readFileSync(
        new URL('./pwa/sw.js', import.meta.url),
        'utf8',
      )
        .replace('__NG_VERSION__', BUILD_VERSION)
        .replace('[] /*__NG_PRECACHE__*/', JSON.stringify(assets))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  define: { __APP_VERSION__: JSON.stringify(BUILD_VERSION) },
  plugins: [
    tailwindcss(),
    netlify(),
    tanstackStart(),
    viteReact(),
    nextgenServiceWorker(),
  ],
})

export default config
