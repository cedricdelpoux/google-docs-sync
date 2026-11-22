import {mkdtemp, rm, writeFile} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"

import {afterEach, expect, test} from "vitest"

import {getDocument, getDocuments} from "../lib/documents.js"

const FRONTMATTER = [
  "---",
  "name: Home",
  "slug: /",
  "comments:",
  "  - id: c1",
  "    content: Source?",
  "    author:",
  "      displayName: Ada",
  "    resolved: false",
  "    replies: []",
  "---",
  "",
  "# Home",
  "",
].join("\n")

let directory

afterEach(() => rm(directory, {recursive: true, force: true}))

const write = async () => {
  directory = await mkdtemp(join(tmpdir(), "next-google-docs-comments-"))
  await writeFile(join(directory, "index.md"), FRONTMATTER)

  return {outputDir: directory, publicDir: "public/docs"}
}

test("returns the comments in the metadata of a document", async () => {
  const paths = await write()
  const {metadata} = await getDocument("/", paths)

  expect(metadata.comments[0].author.displayName).toBe("Ada")
})

test("lists the comments in the metadata of every document", async () => {
  const paths = await write()
  const [metadata] = await getDocuments(paths)

  expect(metadata.comments).toHaveLength(1)
})
