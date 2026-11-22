import {mkdtemp, readFile, rm} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"

import {GoogleDocument} from "google-docs-to-markdown"
import {describe, expect, test} from "vitest"

import {
  getDocumentPath,
  getImagesDirectory,
  writeDocuments,
} from "../lib/write-documents.js"

describe("getDocumentPath", () => {
  test("maps the root document to an index file", () => {
    expect(getDocumentPath("/", "md")).toBe("index.md")
  })

  test("mirrors the slug tree", () => {
    expect(getDocumentPath("/foo/bar", "md")).toBe("foo/bar.md")
  })

  test("honours the extension", () => {
    expect(getDocumentPath("/foo", "mdx")).toBe("foo.mdx")
  })

  test("tolerates a missing slug", () => {
    expect(getDocumentPath(undefined, "md")).toBe("index.md")
  })
})

describe("getImagesDirectory", () => {
  test("gives each document a directory of its own", () => {
    expect(getImagesDirectory("/foo")).toBe("images/foo")
    expect(getImagesDirectory("/")).toBe("images/index")
  })

  test("tolerates a missing slug", () => {
    expect(getImagesDirectory(undefined)).toBe("images/index")
  })

  test("keeps nested slugs apart from flattened ones", () => {
    expect(getImagesDirectory("/foo/bar")).not.toBe(
      getImagesDirectory("/foo-bar")
    )
  })
})

describe("writeDocuments", () => {
  const document = {
    title: "Home",
    body: {content: []},
    documentStyle: {},
    inlineObjects: {},
  }

  const write = (outputDir, comments) =>
    writeDocuments({
      documents: [
        {
          isStored: true,
          googleDocument: new GoogleDocument(document, {
            frontmatter: {id: "1", name: "Home", slug: "/", comments},
          }),
        },
      ],
      options: {outputDir, extension: "md", skipImages: true},
      logger: {warn() {}},
    })

  test("rewrites a document whose comments changed, though the document did not", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "write-documents-"))

    try {
      await write(outputDir, [{id: "c1", content: "First"}])
      await write(outputDir, [{id: "c1", content: "Second"}])

      expect(await readFile(join(outputDir, "index.md"), "utf8")).toContain(
        "Second"
      )
    } finally {
      await rm(outputDir, {recursive: true, force: true})
    }
  })
})
