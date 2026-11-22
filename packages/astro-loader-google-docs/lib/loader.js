import {basename, dirname, extname, join, relative, resolve} from "node:path"
import {fileURLToPath, pathToFileURL} from "node:url"

import {syncGoogleDocs} from "google-docs-sync"
import YAML from "yaml"

import {createGoogleDocsSchema} from "./schema.js"

const FRONTMATTER = /^---\n([\s\S]*?\n)?---\n/

const splitFrontmatter = (markdown) => {
  const match = markdown.match(FRONTMATTER)

  return {
    data: match ? YAML.parse(match[1] || "") || {} : {},
    body: match ? markdown.slice(match[0].length) : markdown,
  }
}

const toPosix = (path) => path.split("\\").join("/")

const createLogger = (logger) => ({
  info: (message) => logger.info(message),
  warn: (message) => logger.warn(message),
  error: (message) => logger.error(message),
})

/**
 * Sync a Google Drive folder and store one entry per document, its id being
 * the path under `outputDir` without the extension.
 *
 * @param {Omit<import("google-docs-sync").Options, "extension" | "logger">} options The options of `google-docs-sync`
 * @returns {import("astro/loaders").Loader}
 */
export function googleDocsLoader(options) {
  return {
    name: "google-docs-loader",
    schema: createGoogleDocsSchema(),
    load: async ({
      store,
      parseData,
      renderMarkdown,
      generateDigest,
      logger,
      config,
    }) => {
      const rootDir = fileURLToPath(config.root)
      const outputDir = resolve(
        rootDir,
        options.outputDir ?? "content/google-docs"
      )
      const {documents} = await syncGoogleDocs({
        ...options,
        extension: "md",
        outputDir,
        cacheDir: resolve(rootDir, options.cacheDir ?? ".google-docs"),
        logger: createLogger(logger),
      })
      const ids = new Set()

      for (const {filePath, markdown} of documents) {
        const absolutePath = resolve(filePath)
        const documentPath = relative(outputDir, absolutePath)
        const id = toPosix(
          join(
            dirname(documentPath),
            basename(documentPath, extname(documentPath))
          )
        )
        const digest = generateDigest(markdown)

        ids.add(id)

        if (store.get(id)?.digest === digest) continue

        const {data, body} = splitFrontmatter(markdown)
        const rendered = await renderMarkdown(body, {
          fileURL: pathToFileURL(absolutePath),
        })

        store.set({
          id,
          data: await parseData({id, data}),
          body,
          digest,
          filePath: toPosix(relative(rootDir, absolutePath)),
          rendered,
          assetImports: rendered.metadata?.imagePaths,
        })
      }

      for (const id of store.keys()) {
        if (!ids.has(id)) store.delete(id)
      }
    },
  }
}
