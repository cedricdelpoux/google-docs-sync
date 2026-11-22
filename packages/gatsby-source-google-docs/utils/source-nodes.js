import {resolve} from "node:path"

import _merge from "lodash/merge.js"
import {createFileNode} from "gatsby-source-filesystem/create-file-node.js"
import {syncGoogleDocs} from "google-docs-sync"

import {DEFAULT_OPTIONS} from "./constants.js"

const SOURCE_INSTANCE_NAME = "google-docs"

const createLogger = (reporter) => ({
  info: (message) => reporter.info(`source-google-docs: ${message}`),
  warn: (message) => reporter.warn(`source-google-docs: ${message}`),
  error: (message) => reporter.error(`source-google-docs: ${message}`),
})

export const sourceNodes = async (
  {actions: {createNode}, reporter, cache, createNodeId, store: gatsbyStore},
  pluginOptions
) => {
  const options = _merge({}, DEFAULT_OPTIONS, pluginOptions)

  if (!options.folder) {
    if (options.folders && options.folders.length > 0) {
      reporter.warn(
        `source-google-docs: "folders" option will be deprecated in the next version, please use "folder" option instead`
      )
      Object.assign(options, {
        folder: options.folders[0],
      })
    } else {
      reporter.warn(`source-google-docs: Missing "folder" option`)
      return
    }
  }

  try {
    const timer = reporter.activityTimer(`source-google-docs`)
    timer.start()
    timer.setStatus("fetching Google Docs documents")

    // Not the Gatsby cache, which Gatsby empties on its own
    const siteDirectory = gatsbyStore
      ? gatsbyStore.getState().program.directory
      : process.cwd()

    const {documents, files, fetchedCount, imagesCount, downloadedImagesCount} =
      await syncGoogleDocs({
        ...options,
        cacheDir: resolve(siteDirectory, options.cacheDir),
        logger: createLogger(reporter),
      })

    const contents = new Map(
      documents.map(({filePath, markdown}) => [resolve(filePath), markdown])
    )

    for (const file of files) {
      const absolutePath = resolve(file)
      const fileNode = await createFileNode(
        absolutePath,
        createNodeId,
        {name: SOURCE_INSTANCE_NAME, path: resolve(options.outputDir)},
        cache
      )
      const content = contents.get(absolutePath)

      // Spares `loadNodeContent` the plugin that owns the node
      if (content !== undefined) {
        fileNode.internal.content = content
      }

      // `File` belongs to `gatsby-source-filesystem`, Gatsby rejects another owner
      createNode(fileNode, {name: "gatsby-source-filesystem"})
    }

    timer.setStatus(
      `${documents.length} documents (${fetchedCount} fetched) ` +
        `and ${imagesCount} images (${downloadedImagesCount} downloaded)`
    )

    timer.end()
  } catch (e) {
    if (options.debug) {
      reporter.panic("source-google-docs: ", e)
    } else {
      reporter.panic(`source-google-docs: ${e.message}`)
    }
  }
}
