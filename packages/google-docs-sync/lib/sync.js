import {resolve} from "node:path"

import {getAuth} from "./auth.js"
import {fetchDocument} from "./fetch-document.js"
import {listFiles, removeStaleFiles} from "./files.js"
import {fetchDocuments} from "./google-docs.js"
import {getImageUrlParameters} from "./get-image-url.js"
import {DEFAULT_OPTIONS} from "./options.js"
import {createStore} from "./store.js"
import {writeDocuments} from "./write-documents.js"

/**
 * @typedef {object} SyncedDocument
 * @property {string} filePath Where the document is written
 * @property {string} markdown What is written, with the image paths rewritten
 * @property {import("./google-drive.js").Metadata} metadata
 */

/**
 * Sync a Google Drive folder to `outputDir`.
 *
 * @param {import("./options.js").Options} options
 */
export async function syncGoogleDocs({auth, logger = console, ...userOptions}) {
  const options = {...DEFAULT_OPTIONS, ...userOptions}

  if (!options.folder) {
    throw new Error(`Missing "folder" option`)
  }

  const store = createStore({dir: resolve(options.cacheDir)})

  await store.init({imagesParams: getImageUrlParameters(options)})

  const client = auth || (await getAuth())
  const {documents: googleDocuments, fetchedCount} = await fetchDocuments({
    options,
    logger,
    store,
    auth: client,
  })

  const {writtenFiles, documents, imagesCount, downloadedImagesCount} =
    await writeDocuments({
      documents: googleDocuments,
      options,
      logger,
      store,
      refetchDocument: (id) => fetchDocument(id, {auth: client}),
    })

  // An empty listing is more likely an unreadable folder than an emptied one
  if (googleDocuments.length > 0) {
    await store.prune(
      googleDocuments.map(({googleDocument}) => googleDocument.frontmatter.id)
    )
  }
  await removeStaleFiles({outputDir: options.outputDir, writtenFiles})

  return {
    documents: /** @type {SyncedDocument[]} */ (documents),
    files: await listFiles(options.outputDir),
    fetchedCount,
    imagesCount,
    downloadedImagesCount,
  }
}
