import {afterEach, beforeEach, expect, test} from "vitest"

import {mkdir, mkdtemp, readdir, rm, writeFile} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"

import {listFiles, removeStaleFiles} from "../lib/files.js"

let dir

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "google-docs-files-"))
})

afterEach(async () => {
  await rm(dir, {recursive: true, force: true})
})

test("lists the files of a directory and of its subdirectories", async () => {
  await mkdir(join(dir, "blog"))
  await writeFile(join(dir, "index.md"), "")
  await writeFile(join(dir, "blog", "post.md"), "")

  expect((await listFiles(dir)).sort()).toEqual([
    join(dir, "blog", "post.md"),
    join(dir, "index.md"),
  ])
})

test("lists nothing in a directory that does not exist", async () => {
  expect(await listFiles(join(dir, "missing"))).toEqual([])
})

test("does not swallow another error while listing", async () => {
  await writeFile(join(dir, "file"), "")

  await expect(listFiles(join(dir, "file"))).rejects.toThrow("ENOTDIR")
})

test("removes the files a sync did not write and the directories they leave empty", async () => {
  await mkdir(join(dir, "old"))
  await writeFile(join(dir, "old", "stale.md"), "")
  await writeFile(join(dir, "stale.md"), "")
  await writeFile(join(dir, "kept.md"), "")

  await removeStaleFiles({
    outputDir: dir,
    writtenFiles: [join(dir, "kept.md")],
  })

  expect(await readdir(dir)).toEqual(["kept.md"])
})

test("has nothing to remove in an output directory that does not exist", async () => {
  await expect(
    removeStaleFiles({outputDir: join(dir, "missing"), writtenFiles: []})
  ).resolves.toBeUndefined()
})

test("does not swallow another error while removing", async () => {
  await writeFile(join(dir, "file"), "")

  await expect(
    removeStaleFiles({outputDir: join(dir, "file"), writtenFiles: []})
  ).rejects.toThrow("ENOTDIR")
})
