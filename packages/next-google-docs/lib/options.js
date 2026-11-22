import {posix, relative} from "node:path"

const ENV_NAME = "NEXT_GOOGLE_DOCS_OPTIONS"

/**
 * @typedef {object} PathOptions
 * @property {string} [outputDir] Directory the documents are synced to, "content/google-docs" by default
 * @property {string} [publicDir] Directory inside `public/` the images are copied to, "public/google-docs" by default. It is managed by the adapter: it is emptied before every sync.
 */

/**
 * @typedef {import("google-docs-sync").Options & PathOptions} Options
 */

export const DEFAULT_PATHS = {
  outputDir: "content/google-docs",
  publicDir: "public/google-docs",
}

/**
 * The next.config process hands the paths to the server code that reads the
 * documents, which is bundled apart and does not see the config.
 *
 * @param {PathOptions} paths
 */
export const storePaths = ({outputDir, publicDir}) => {
  process.env[ENV_NAME] = JSON.stringify({outputDir, publicDir})
}

/** @param {PathOptions} [overrides] */
export const resolvePaths = (overrides = {}) => ({
  ...DEFAULT_PATHS,
  ...JSON.parse(process.env[ENV_NAME] || "{}"),
  ...overrides,
})

export const getPublicPath = (publicDir) => {
  const path = posix.normalize(
    relative("public", publicDir).split("\\").join("/")
  )

  if (path.startsWith("..")) {
    throw new Error(`"publicDir" must be inside "public", got "${publicDir}"`)
  }

  return path === "." ? "" : `/${path}`
}
