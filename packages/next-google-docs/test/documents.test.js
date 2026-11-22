import {mkdir, mkdtemp, rm, writeFile} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"

import {afterEach, beforeEach, expect, test} from "vitest"

import {getDocument, getDocuments} from "../lib/documents.js"

let paths

beforeEach(async () => {
  const directory = await mkdtemp(join(tmpdir(), "next-google-docs-"))
  paths = {outputDir: directory, publicDir: "public/docs"}
  await mkdir(join(directory, "features"))
  await writeFile(
    join(directory, "index.md"),
    "---\nname: Home\nslug: /\n---\n\n# Home\n"
  )
  await writeFile(
    join(directory, "features/images.md"),
    [
      "---",
      "name: Images",
      "slug: /features/images",
      "cover:",
      "  image: ../images/images/cover.png",
      "---",
      "",
      '![](../images/images/a.png "Alt")',
      '<img src="../images/images/b.png">',
      "[Home](/) [Docs](https://example.com/a.png) [Top](#top)",
      "",
    ].join("\n")
  )
  paths.directory = directory
})

afterEach(() => rm(paths.directory, {recursive: true, force: true}))

test("lists the metadata of every document", async () => {
  const documents = await getDocuments(paths)

  expect(documents.map(({slug}) => slug)).toEqual(["/features/images", "/"])
})

test("reads a document by slug, with the frontmatter removed", async () => {
  const {metadata, markdown} = await getDocument("/", paths)

  expect(metadata.name).toBe("Home")
  expect(markdown).toBe("\n# Home\n")
})

test("accepts the segments of a catch-all route", async () => {
  expect((await getDocument(["features", "images"], paths)).metadata.name).toBe(
    "Images"
  )
  expect((await getDocument([], paths)).metadata.name).toBe("Home")
})

test("turns the image paths into public URLs", async () => {
  const {metadata, markdown} = await getDocument("/features/images", paths)

  expect(metadata.cover.image).toBe("/docs/images/images/cover.png")
  expect(markdown).toContain('![](/docs/images/images/a.png "Alt")')
  expect(markdown).toContain('<img src="/docs/images/images/b.png">')
})

test("leaves the links alone", async () => {
  const {markdown} = await getDocument("/features/images", paths)

  expect(markdown).toContain(
    "[Home](/) [Docs](https://example.com/a.png) [Top](#top)"
  )
})

test("returns null for an unknown slug", async () => {
  expect(await getDocument("/missing", paths)).toBeNull()
})
