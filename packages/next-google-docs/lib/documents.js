import {readdir, readFile} from "node:fs/promises"
import {dirname, extname, join, posix} from "node:path"

import {parse} from "yaml"

import {getPublicPath, resolvePaths} from "./options.js"

const DOCUMENT_EXTENSIONS = [".md", ".mdx"]
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const MARKDOWN_IMAGE = /(\]\()([^)\s]+)/g
const HTML_SRC = /(src=")([^"]+)/g
const URL_WITH_SCHEME = /^([a-z][a-z\d+.-]*:|\/|#)/i

/**
 * @typedef {import("google-docs-sync").Metadata} Metadata
 * @typedef {import("./options.js").PathOptions} PathOptions
 */

const toImageUrl = (reference, {documentDir, publicPath}) => {
  if (URL_WITH_SCHEME.test(reference)) {
    return reference
  }

  const target = posix.join(documentDir, reference)

  if (target.startsWith("..") || !extname(target)) {
    return reference
  }

  return posix.join(publicPath, target)
}

const toSlug = (slug) =>
  `/${[slug].flat().join("/")}`.replace(/\/+/g, "/").replace(/(.)\/$/, "$1")

const readDocuments = async (overrides) => {
  const {outputDir, publicDir} = resolvePaths(overrides)
  const publicPath = getPublicPath(publicDir)
  const names = await readdir(outputDir, {recursive: true})
  const documentNames = names
    .filter((name) => DOCUMENT_EXTENSIONS.includes(extname(name)))
    .sort()

  return Promise.all(
    documentNames.map(async (name) => {
      const source = await readFile(join(outputDir, name), "utf8")
      const [frontmatter = "", yaml = ""] = source.match(FRONTMATTER) || []
      const metadata = parse(yaml) ?? {}
      const documentDir = dirname(name).split("\\").join("/")
      const rewrite = (_, prefix, reference) =>
        `${prefix}${toImageUrl(reference, {documentDir, publicPath})}`

      if (metadata.cover?.image) {
        metadata.cover.image = toImageUrl(metadata.cover.image, {
          documentDir,
          publicPath,
        })
      }

      return {
        metadata,
        markdown: source
          .slice(frontmatter.length)
          .replace(MARKDOWN_IMAGE, rewrite)
          .replace(HTML_SRC, rewrite),
      }
    })
  )
}

/**
 * The metadata of every synced document.
 *
 * @param {PathOptions} [paths]
 * @returns {Promise<Metadata[]>}
 */
export const getDocuments = async (paths) =>
  (await readDocuments(paths)).map(({metadata}) => metadata)

/**
 * A synced document, with the paths of its images turned into URLs.
 *
 * @param {string | string[]} slug "/features/images" or the segments of a catch-all route
 * @param {PathOptions} [paths]
 * @returns {Promise<{metadata: Metadata, markdown: string} | null>}
 */
export const getDocument = async (slug, paths) => {
  const documents = await readDocuments(paths)

  return (
    documents.find(({metadata}) => toSlug(metadata.slug) === toSlug(slug)) ??
    null
  )
}
