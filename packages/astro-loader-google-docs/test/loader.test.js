import {beforeEach, expect, test, vi} from "vitest"

import {syncGoogleDocs} from "google-docs-sync"

import {googleDocsLoader} from "../index.js"

vi.mock("google-docs-sync", () => ({syncGoogleDocs: vi.fn()}))

const ROOT = "/site/"
const METADATA = {
  id: "doc-1",
  name: "Home",
  slug: "/",
  path: "/home",
  date: "2021-01-30T09:40:52.702Z",
  createdTime: "2021-01-30T09:40:52.702Z",
  modifiedTime: "2021-01-30T09:40:52.702Z",
  breadcrumb: [{name: "Home", slug: "/"}],
}
const HOME = `---\nid: doc-1\nname: Home\n---\n\n# Home\n\n![](images/index/logo.png)\n`
const GUIDE = `# Guide\n`

const createStore = (entries = {}) => {
  const map = new Map(Object.entries(entries))

  return {
    get: (id) => map.get(id),
    set: vi.fn((entry) => map.set(entry.id, entry)),
    delete: vi.fn((id) => map.delete(id)),
    keys: () => [...map.keys()],
  }
}

const createContext = (store = createStore()) => ({
  store,
  parseData: vi.fn(async ({data}) => data),
  renderMarkdown: vi.fn(async (body) => ({
    html: body,
    metadata: {imagePaths: ["images/index/logo.png"]},
  })),
  generateDigest: vi.fn((value) => `digest:${value}`),
  logger: {info: vi.fn(), warn: vi.fn(), error: vi.fn()},
  config: {root: new URL(`file://${ROOT}`)},
})

const mockDocuments = (documents) =>
  vi.mocked(syncGoogleDocs).mockResolvedValue({documents})

const load = (context, options = {folder: "folder-1"}) =>
  googleDocsLoader(options).load(context)

beforeEach(() => {
  vi.mocked(syncGoogleDocs).mockReset()
})

test("stores one entry per document, identified by its path under the output directory", async () => {
  mockDocuments([
    {filePath: "/site/content/google-docs/index.md", markdown: HOME},
    {filePath: "/site/content/google-docs/guides/guide.md", markdown: GUIDE},
  ])
  const context = createContext()

  await load(context)

  expect(context.store.keys()).toEqual(["index", "guides/guide"])
  expect(context.store.get("index")).toEqual({
    id: "index",
    data: {id: "doc-1", name: "Home"},
    body: "\n# Home\n\n![](images/index/logo.png)\n",
    digest: `digest:${HOME}`,
    filePath: "content/google-docs/index.md",
    rendered: {
      html: "\n# Home\n\n![](images/index/logo.png)\n",
      metadata: {imagePaths: ["images/index/logo.png"]},
    },
    assetImports: ["images/index/logo.png"],
  })
})

test("renders the Markdown relative to its file so that the images resolve", async () => {
  mockDocuments([
    {filePath: "/site/content/google-docs/guides/guide.md", markdown: GUIDE},
  ])
  const context = createContext()

  await load(context)

  expect(context.renderMarkdown).toHaveBeenCalledWith(GUIDE, {
    fileURL: new URL("file:///site/content/google-docs/guides/guide.md"),
  })
})

test("validates the data of the documents with the schema of the collection", async () => {
  mockDocuments([
    {filePath: "/site/content/google-docs/index.md", markdown: HOME},
  ])
  const context = createContext()

  await load(context)

  expect(context.parseData).toHaveBeenCalledWith({
    id: "index",
    data: {id: "doc-1", name: "Home"},
  })
})

test("neither parses nor renders a document whose digest did not change", async () => {
  mockDocuments([
    {filePath: "/site/content/google-docs/index.md", markdown: HOME},
  ])
  const context = createContext(
    createStore({index: {id: "index", digest: `digest:${HOME}`}})
  )

  await load(context)

  expect(context.parseData).not.toHaveBeenCalled()
  expect(context.renderMarkdown).not.toHaveBeenCalled()
  expect(context.store.set).not.toHaveBeenCalled()
})

test("renders again a document whose content changed", async () => {
  mockDocuments([
    {filePath: "/site/content/google-docs/index.md", markdown: HOME},
  ])
  const context = createContext(
    createStore({index: {id: "index", digest: "digest:old"}})
  )

  await load(context)

  expect(context.store.set).toHaveBeenCalledOnce()
})

test("deletes the entries of the documents that are gone", async () => {
  mockDocuments([
    {filePath: "/site/content/google-docs/index.md", markdown: HOME},
  ])
  const context = createContext(
    createStore({removed: {id: "removed", digest: "digest:x"}})
  )

  await load(context)

  expect(context.store.delete).toHaveBeenCalledWith("removed")
  expect(context.store.keys()).toEqual(["index"])
})

test("maps the logger of the sync to the logger of Astro", async () => {
  mockDocuments([])
  const context = createContext()

  await load(context)

  const {logger} = vi.mocked(syncGoogleDocs).mock.calls[0][0]

  logger.info("fetching")
  logger.warn("slow")
  logger.error("failed")

  expect(context.logger.info).toHaveBeenCalledWith("fetching")
  expect(context.logger.warn).toHaveBeenCalledWith("slow")
  expect(context.logger.error).toHaveBeenCalledWith("failed")
})

test("passes the options to the sync, with the directories resolved from the site root", async () => {
  mockDocuments([])
  const auth = {}

  await load(createContext(), {
    folder: "folder-1",
    imagesOptions: {width: 800},
    demoteHeadings: false,
    auth,
    extension: "mdx",
  })

  expect(syncGoogleDocs).toHaveBeenCalledWith({
    folder: "folder-1",
    imagesOptions: {width: 800},
    demoteHeadings: false,
    auth,
    extension: "md",
    outputDir: "/site/content/google-docs",
    cacheDir: "/site/.google-docs",
    logger: expect.any(Object),
  })
})

test("resolves the output and cache directories given as options", async () => {
  mockDocuments([])

  await load(createContext(), {
    folder: "folder-1",
    outputDir: "src/docs",
    cacheDir: ".cache/docs",
  })

  expect(syncGoogleDocs).toHaveBeenCalledWith(
    expect.objectContaining({
      outputDir: "/site/src/docs",
      cacheDir: "/site/.cache/docs",
    })
  )
})

test("exposes a schema that accepts the metadata of a document and keeps the custom ones", () => {
  const {schema} = googleDocsLoader({folder: "folder-1"})
  const data = schema.parse({...METADATA, order: 2})

  expect(data.order).toBe(2)
  expect(data.date).toBeInstanceOf(Date)
})

test("accepts the comments of a document, and does not require them", () => {
  const {schema} = googleDocsLoader({folder: "folder-1"})
  const comment = {
    id: "c1",
    content: "Source?",
    author: {displayName: "Ada"},
    createdTime: "2026-09-01T10:00:00.000Z",
    modifiedTime: "2026-09-01T10:00:00.000Z",
    resolved: false,
    quote: "the passage",
    replies: [
      {
        id: "r1",
        content: "Done",
        author: {displayName: "Bob"},
        createdTime: "2026-09-02T10:00:00.000Z",
      },
    ],
  }

  expect(schema.parse(METADATA).comments).toBeUndefined()

  const {comments} = schema.parse({...METADATA, comments: [comment]})

  expect(comments[0].createdTime).toBeInstanceOf(Date)
  expect(comments[0].replies[0].author.displayName).toBe("Bob")
})
