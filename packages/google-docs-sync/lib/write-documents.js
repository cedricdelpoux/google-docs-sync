import {constants} from "node:fs"
import {copyFile, mkdir, readFile, rm, stat, writeFile} from "node:fs/promises"
import {dirname, extname, join, relative, sep} from "node:path"

import {GoogleDocument} from "google-docs-to-markdown"
import _kebabCase from "lodash/kebabCase.js"
import _sumBy from "lodash/sumBy.js"

import {createLimit} from "./create-limit.js"
import {downloadImage} from "./download-image.js"
import {getImageUrl} from "./get-image-url.js"

const IMAGES_DIR = "images"
const MAX_PARALLEL_DOWNLOADS = 8

const trimSlashes = (slug) => String(slug || "").replace(/^\/+|\/+$/g, "")

/** The tree on disk mirrors the tree of URLs, the root being "index". */
const getDocumentPath = (slug, extension) =>
  `${trimSlashes(slug) || "index"}.${extension}`

/**
 * One directory per document, mirroring its slug: kebab-casing it would map
 * both "/foo/bar" and "/foo-bar" onto "foo-bar".
 */
const getImagesDirectory = (slug) =>
  join(IMAGES_DIR, trimSlashes(slug) || "index")

/** Markdown needs forward slashes, `path.relative` gives back platform ones. */
const toPosix = (path) => path.split(sep).join("/")

/** Fall back to the original size when Google rejects the size parameters. */
const downloadResizedImage = async ({
  url,
  options,
  logger,
  directory,
  name,
}) => {
  const resizedUrl = getImageUrl(url, options)

  if (resizedUrl === url) {
    return downloadImage({url, directory, name})
  }

  try {
    return await downloadImage({url: resizedUrl, directory, name})
  } catch (e) {
    if (e.status !== 400) throw e

    logger.warn(`${e.message}, downloading it at its original size`)

    return downloadImage({url, directory, name})
  }
}

/**
 * Copy a stored image next to its document, unless an up to date copy is
 * already there. A copy rather than a link, since `outputDir` is swept clean.
 */
const copyImage = async (source, destination) => {
  const [sourceStats, destinationStats] = await Promise.all([
    stat(source),
    stat(destination).catch((e) => {
      if (e.code === "ENOENT") return null

      throw e
    }),
  ])

  if (
    destinationStats &&
    destinationStats.size === sourceStats.size &&
    destinationStats.mtimeMs >= sourceStats.mtimeMs
  ) {
    return
  }

  await mkdir(dirname(destination), {recursive: true})
  await copyFile(source, destination, constants.COPYFILE_FICLONE)
}

/** File watchers react to the modification time, so leave unchanged files. */
const writeIfChanged = async (filePath, content) => {
  try {
    if ((await readFile(filePath, "utf8")) === content) return
  } catch (e) {
    if (e.code !== "ENOENT") throw e
  }

  await mkdir(dirname(filePath), {recursive: true})
  await writeFile(filePath, content)
}

/**
 * Download the images of a document to the store, copy them next to it and
 * rewrite their URLs into paths relative to the document file.
 */
async function writeImages({
  googleDocument,
  isStored,
  markdown,
  outputDir,
  documentPath,
  options,
  logger,
  store,
  refetchDocument,
  limit,
}) {
  const {images} = googleDocument

  if (images.length === 0) {
    return {markdown, imageFiles: [], downloadedCount: 0}
  }

  const documentId = googleDocument.frontmatter.id
  const imagesDirectory = getImagesDirectory(googleDocument.frontmatter.slug)
  const documentDirectory = dirname(join(outputDir, documentPath))
  const storeDirectory = store.imagesDirectory(documentId)
  const storedImages = await store.readImages(documentId)
  const imageFiles = []
  const usedImageIds = new Set(images.map(({id}) => id))
  let updatedMarkdown = markdown
  let downloadedCount = 0
  let freshUrlsById

  // Google expires the image URLs a few minutes after a fetch

  const getFreshUrl = async ({id, url}) => {
    freshUrlsById ??= refetchDocument(documentId).then(
      (document) =>
        new Map(
          new GoogleDocument(document).images.map((image) => [
            image.id,
            image.url,
          ])
        )
    )

    return (await freshUrlsById).get(id) || url
  }

  const download = (image, url) =>
    downloadResizedImage({
      url,
      options,
      logger,
      directory: storeDirectory,
      name: image.id,
    })

  const downloadToStore = async (image) => {
    if (isStored) return download(image, await getFreshUrl(image))

    try {
      return await download(image, image.url)
    } catch (e) {
      const isExpired = e.status === 403

      if (!isExpired) throw e

      return download(image, await getFreshUrl(image))
    }
  }

  const fileNames = await Promise.all(
    images.map(async (image) => {
      const storedFileName = storedImages.get(image.id)

      if (storedFileName) return storedFileName

      try {
        const fileName = await limit(() => downloadToStore(image))

        downloadedCount++

        return fileName
      } catch (e) {
        logger.warn(e.message)

        return null
      }
    })
  )

  for (const [index, image] of images.entries()) {
    const fileName = fileNames[index]

    if (!fileName) continue

    const {url, title} = image
    const name = title
      ? _kebabCase(title)
      : `${_kebabCase(googleDocument.frontmatter.name) || "image"}-${index + 1}`

    try {
      const imagePath = join(
        outputDir,
        imagesDirectory,
        `${name}${extname(fileName)}`
      )

      await copyImage(join(storeDirectory, fileName), imagePath)

      const relativePath = toPosix(relative(documentDirectory, imagePath))

      // Not `replace`: the cover and the body can reference the same URL
      updatedMarkdown = updatedMarkdown.split(url).join(relativePath)
      imageFiles.push(imagePath)
    } catch (e) {
      logger.warn(e.message)
    }
  }

  // Only once every image made it, so a failed download never costs a stored one
  if (imageFiles.length === images.length) {
    for (const [imageId, fileName] of storedImages) {
      if (!usedImageIds.has(imageId)) {
        await rm(join(storeDirectory, fileName), {force: true})
      }
    }
  }

  return {markdown: updatedMarkdown, imageFiles, downloadedCount}
}

/** Write every fetched document and its images to `outputDir`. */
async function writeDocuments({
  documents: googleDocuments,
  options,
  logger,
  store,
  refetchDocument,
}) {
  const outputDir = options.outputDir
  const extension = options.extension
  const limit = createLimit(MAX_PARALLEL_DOWNLOADS)

  const results = await Promise.all(
    googleDocuments.map(async ({googleDocument, isStored}) => {
      const documentPath = getDocumentPath(
        googleDocument.frontmatter.slug,
        extension
      )
      const filePath = join(outputDir, documentPath)
      let markdown = googleDocument.toMarkdown()
      let writtenImages = {imageFiles: [], downloadedCount: 0}

      if (!options.skipImages) {
        writtenImages = await writeImages({
          googleDocument,
          isStored,
          markdown,
          outputDir,
          documentPath,
          options,
          logger,
          store,
          refetchDocument,
          limit,
        })
        markdown = writtenImages.markdown
      }

      await writeIfChanged(filePath, markdown)

      return {
        filePath,
        markdown,
        metadata: googleDocument.frontmatter,
        ...writtenImages,
      }
    })
  )

  return {
    writtenFiles: results.flatMap(({filePath, imageFiles}) => [
      ...imageFiles,
      filePath,
    ]),
    documents: results.map(({filePath, markdown, metadata}) => ({
      filePath,
      markdown,
      metadata,
    })),
    imagesCount: _sumBy(results, ({imageFiles}) => imageFiles.length),
    downloadedImagesCount: _sumBy(results, "downloadedCount"),
  }
}

export {writeDocuments, getDocumentPath, getImagesDirectory}
