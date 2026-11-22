import {existsSync} from "node:fs"

import {defineConfig} from "astro/config"

// The Google credentials are read from the environment by the loader
if (existsSync(".env")) process.loadEnvFile()

export default defineConfig({
  server: {port: 8105},
  vite: {
    server: {strictPort: true},
    preview: {strictPort: true},
  },
})
