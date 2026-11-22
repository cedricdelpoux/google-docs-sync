import {GoogleDocument} from "google-docs-to-markdown"

import {fetchDocument} from "./fetch-document.js"
import {fetchComments, fetchFiles} from "./google-drive.js"

/**
 * Fetch the documents of the folder, except the ones the store holds with the
 * same `modifiedTime`. The metadata always comes from the listing.
 *
 * The comments are never stored: Drive does not reliably move `modifiedTime`
 * when one is added or resolved.
 */
async function fetchDocuments({options, logger, store, auth}) {
  if (options.debug) {
    logger.info("fetching documents")
  }

  const documentsProperties = await fetchFiles(options, {auth, logger})
  const links = documentsProperties.reduce(
    (acc, properties) => ({...acc, [properties.id]: properties.slug}),
    {}
  )

  let fetchedCount = 0

  const documents = await Promise.all(
    documentsProperties.map(async (properties) => {
      const stored = await store.readDocument(properties.id)
      const isStored = Boolean(
        stored &&
        stored.document &&
        properties.modifiedTime &&
        stored.modifiedTime === properties.modifiedTime
      )
      let document

      if (isStored) {
        document = stored.document
      } else {
        document = await fetchDocument(properties.id, {auth})
        fetchedCount++

        await store.writeDocument({
          id: properties.id,
          modifiedTime: properties.modifiedTime,
          document,
        })
      }

      const comments = options.comments
        ? await fetchComments(properties.id, {auth})
        : undefined

      const googleDocument = new GoogleDocument(document, {
        ...options,
        mdx: options.extension === "mdx",
        frontmatter: options.comments ? {...properties, comments} : properties,
        links,
      })

      return {googleDocument, isStored}
    })
  )

  if (options.debug) {
    logger.info(
      `${documents.length} documents, ${fetchedCount} fetched from Google Docs`
    )
  }

  return {documents, fetchedCount}
}

export {fetchDocuments}
