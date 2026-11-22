import {cp, mkdir, rm} from "node:fs/promises"
import {dirname, join, relative, resolve} from "node:path"

import {syncGoogleDocs} from "google-docs-sync"

import {DEFAULT_PATHS, getPublicPath, storePaths} from "./options.js"

const SYNC_PHASES = ["phase-development-server", "phase-production-build"]
const SYNCED_ENV_NAME = "NEXT_GOOGLE_DOCS_SYNCED"
const DOCUMENT_EXTENSIONS = [".md", ".mdx"]

const defaultLogger = {
  info: (message) => console.log(`google-docs: ${message}`),
  warn: (message) => console.warn(`google-docs: ${message}`),
  error: (message) => console.error(`google-docs: ${message}`),
}

const copyImages = async ({files, outputDir, publicDir}) => {
  await rm(publicDir, {recursive: true, force: true})

  for (const file of files) {
    if (DOCUMENT_EXTENSIONS.some((extension) => file.endsWith(extension))) {
      continue
    }

    const target = join(publicDir, relative(resolve(outputDir), resolve(file)))
    await mkdir(dirname(target), {recursive: true})
    await cp(file, target)
  }
}

const sync = async (options) => {
  const {outputDir, publicDir, ...syncOptions} = options
  const {files, fetchedCount, imagesCount} = await syncGoogleDocs({
    logger: defaultLogger,
    ...syncOptions,
    outputDir,
  })

  await copyImages({files, outputDir, publicDir})
  defaultLogger.info(
    `${fetchedCount} documents fetched, ${imagesCount} images in ${publicDir}`
  )
}

let syncing

/**
 * Wrap a Next.js config so that the Google Docs are synced once when
 * `next dev` or `next build` starts.
 *
 * @param {object | ((phase: string, context: object) => object | Promise<object>)} nextConfig
 * @param {import("./options.js").Options} options
 */
export const withGoogleDocs = (nextConfig = {}, options) => {
  const paths = {...DEFAULT_PATHS, ...options}
  getPublicPath(paths.publicDir)

  return async (phase, context) => {
    storePaths(paths)

    // Next loads the config again in its workers, which inherit the environment
    const isSynced = syncing || process.env[SYNCED_ENV_NAME]

    if (SYNC_PHASES.includes(phase) && !isSynced) {
      process.env[SYNCED_ENV_NAME] = "1"
      syncing = sync(paths)
    }
    await syncing

    return typeof nextConfig === "function"
      ? nextConfig(phase, context)
      : nextConfig
  }
}
