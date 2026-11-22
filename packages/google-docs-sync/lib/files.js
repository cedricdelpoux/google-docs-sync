import {readdir, rm} from "node:fs/promises"
import {join, resolve} from "node:path"

/** Like `readdir`, with no entries for a missing directory. */
export async function readEntries(directory) {
  try {
    return await readdir(directory, {withFileTypes: true})
  } catch (e) {
    if (e.code === "ENOENT") return []
    throw e
  }
}

export async function removeStaleFiles({outputDir, writtenFiles}) {
  const kept = new Set(writtenFiles.map((file) => resolve(file)))

  const walk = async (directory) => {
    const entries = await readEntries(directory)
    let empty = true

    for (const entry of entries) {
      const entryPath = join(directory, entry.name)

      if (entry.isDirectory()) {
        const childEmpty = await walk(entryPath)

        if (childEmpty) {
          await rm(entryPath, {recursive: true, force: true})
        } else {
          empty = false
        }
      } else if (kept.has(resolve(entryPath))) {
        empty = false
      } else {
        await rm(entryPath, {force: true})
      }
    }

    return empty
  }

  await walk(outputDir)
}

export async function listFiles(directory) {
  const entries = await readEntries(directory)

  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name)

      return entry.isDirectory() ? listFiles(entryPath) : [entryPath]
    })
  )

  return files.flat()
}
