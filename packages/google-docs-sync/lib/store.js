import {mkdir, readFile, rename, rm, writeFile} from "node:fs/promises"
import {basename, dirname, extname, join} from "node:path"

import {readEntries} from "./files.js"

// Kept apart from the cache of a framework, which it empties whenever its
// configuration or its dependencies change
const VERSION = 1

const DOCUMENTS_DIRECTORY = "documents"
const IMAGES_DIRECTORY = "images"
const STATE_FILE = "state.json"

/** Ids come from Google: keep them from naming a file outside the store. */
const toFileName = (id) =>
  String(id)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/^\.+/, "")

const readJson = async (file) => {
  let content

  try {
    content = await readFile(file, "utf8")
  } catch (e) {
    if (e.code === "ENOENT") return null

    throw e
  }

  try {
    return JSON.parse(content)
  } catch {
    throw new Error(`${file} is not valid JSON, delete it to fetch it again`)
  }
}

// Renamed into place so that an interrupted build never leaves a truncated file
const writeJson = async (file, content) => {
  const temporaryFile = `${file}.tmp`

  await mkdir(dirname(file), {recursive: true})
  await writeFile(temporaryFile, JSON.stringify(content))
  await rename(temporaryFile, file)
}

/** The cache directory: one file per document, and its images. */
const createStore = ({dir}) => {
  const documentsDirectory = join(dir, DOCUMENTS_DIRECTORY)
  const imagesDirectory = join(dir, IMAGES_DIRECTORY)
  const stateFile = join(dir, STATE_FILE)
  const documentFile = (id) =>
    join(documentsDirectory, `${toFileName(id)}.json`)
  const documentImagesDirectory = (id) => join(imagesDirectory, toFileName(id))

  return {
    dir,

    /** Drop what cannot be reused: another version, or other image sizes. */
    async init({imagesParams}) {
      const state = (await readJson(stateFile)) || {}

      if (state.version !== VERSION) {
        await rm(dir, {recursive: true, force: true})
      } else if (state.imagesParams !== imagesParams) {
        await rm(imagesDirectory, {recursive: true, force: true})
      }

      await writeJson(stateFile, {version: VERSION, imagesParams})
    },

    /** @returns {Promise<{modifiedTime: string, document: object} | null>} */
    async readDocument(id) {
      return readJson(documentFile(id))
    },

    async writeDocument({id, modifiedTime, document}) {
      await writeJson(documentFile(id), {modifiedTime, document})
    },

    imagesDirectory: documentImagesDirectory,

    /**
     * The extension is only known once an image is downloaded, hence the
     * `readdir` rather than a `stat` per image.
     *
     * @returns {Promise<Map<string, string>>} object id -> file name
     */
    async readImages(id) {
      const files = (await readEntries(documentImagesDirectory(id))).map(
        ({name}) => name
      )

      return new Map(files.map((file) => [basename(file, extname(file)), file]))
    },

    async prune(ids) {
      const kept = new Set(ids.map(toFileName))

      for (const {name: file} of await readEntries(documentsDirectory)) {
        if (!kept.has(basename(file, extname(file)))) {
          await rm(join(documentsDirectory, file), {
            recursive: true,
            force: true,
          })
        }
      }

      for (const {name: directory} of await readEntries(imagesDirectory)) {
        if (!kept.has(directory)) {
          await rm(join(imagesDirectory, directory), {
            recursive: true,
            force: true,
          })
        }
      }
    },
  }
}

export {createStore}
