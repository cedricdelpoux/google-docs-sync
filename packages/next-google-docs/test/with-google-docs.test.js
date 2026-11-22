import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises"
import {tmpdir} from "node:os"
import {join} from "node:path"

import {afterEach, beforeEach, expect, test, vi} from "vitest"
import {syncGoogleDocs} from "google-docs-sync"

vi.mock("google-docs-sync", () => ({syncGoogleDocs: vi.fn()}))

const BUILD = "phase-production-build"

const cwd = process.cwd()

let directory
let withGoogleDocs

beforeEach(async () => {
  vi.resetModules()
  delete process.env.NEXT_GOOGLE_DOCS_SYNCED
  delete process.env.NEXT_GOOGLE_DOCS_OPTIONS
  directory = await mkdtemp(join(tmpdir(), "next-google-docs-"))
  process.chdir(directory)
  await mkdir(join(directory, "content/images/home"), {recursive: true})
  await writeFile(join(directory, "content/images/home/a.png"), "png")
  await writeFile(join(directory, "content/home.md"), "# Home")
  vi.mocked(syncGoogleDocs)
    .mockReset()
    .mockResolvedValue({
      files: [
        join(directory, "content/home.md"),
        join(directory, "content/images/home/a.png"),
      ],
      fetchedCount: 1,
      imagesCount: 1,
    })
  ;({withGoogleDocs} = await import("../lib/with-google-docs.js"))
})

afterEach(async () => {
  process.chdir(cwd)
  await rm(directory, {recursive: true, force: true})
})

const createOptions = () => ({
  folder: "FOLDER",
  outputDir: join(directory, "content"),
  publicDir: "public/docs",
  logger: {info: vi.fn(), warn: vi.fn(), error: vi.fn()},
})

test("syncs once on build and passes the sync options through", async () => {
  const options = createOptions()
  const config = withGoogleDocs({reactStrictMode: true}, options)

  await config(BUILD, {})

  expect(syncGoogleDocs).toHaveBeenCalledTimes(1)
  expect(syncGoogleDocs).toHaveBeenCalledWith(
    expect.objectContaining({
      folder: "FOLDER",
      outputDir: options.outputDir,
      logger: options.logger,
    })
  )
  expect(syncGoogleDocs.mock.calls[0][0]).not.toHaveProperty("publicDir")
})

test("does not sync again when the config is loaded again", async () => {
  const config = withGoogleDocs({}, createOptions())

  await Promise.all([config(BUILD, {}), config(BUILD, {})])
  await config("phase-development-server", {})

  expect(syncGoogleDocs).toHaveBeenCalledTimes(1)
})

test("does not sync in a worker that inherits the environment", async () => {
  process.env.NEXT_GOOGLE_DOCS_SYNCED = "1"

  await withGoogleDocs({}, createOptions())(BUILD, {})

  expect(syncGoogleDocs).not.toHaveBeenCalled()
})

test("does not sync outside of dev and build", async () => {
  await withGoogleDocs({}, createOptions())("phase-production-server", {})

  expect(syncGoogleDocs).not.toHaveBeenCalled()
})

test("returns the config untouched", async () => {
  const nextConfig = {reactStrictMode: true}

  const config = await withGoogleDocs(nextConfig, createOptions())(BUILD, {})

  expect(config).toBe(nextConfig)
})

test("resolves a config function with its phase and context", async () => {
  const nextConfig = vi.fn(async () => ({output: "export"}))
  const context = {defaultConfig: {}}

  const config = await withGoogleDocs(nextConfig, createOptions())(
    BUILD,
    context
  )

  expect(nextConfig).toHaveBeenCalledWith(BUILD, context)
  expect(config).toEqual({output: "export"})
})

test("copies the images, and only the images, to the public directory", async () => {
  vi.mocked(syncGoogleDocs).mockResolvedValue({
    files: ["content/home.md", "content/images/home/a.png"],
    fetchedCount: 1,
    imagesCount: 1,
  })

  await withGoogleDocs({}, {...createOptions(), outputDir: "content"})(
    BUILD,
    {}
  )

  expect(await readFile("public/docs/images/home/a.png", "utf8")).toBe("png")
  await expect(readFile("public/docs/home.md")).rejects.toThrow()
})

test("rejects a public directory outside of public", () => {
  expect(() =>
    withGoogleDocs({}, {...createOptions(), publicDir: "static/docs"})
  ).toThrow('"publicDir" must be inside "public"')
})

test("fails the build when the sync fails", async () => {
  vi.mocked(syncGoogleDocs).mockRejectedValue(new Error("Missing folder"))

  await expect(withGoogleDocs({}, createOptions())(BUILD, {})).rejects.toThrow(
    "Missing folder"
  )
})

test("logs with the google-docs prefix when no logger is given", async () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {})
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  const error = vi.spyOn(console, "error").mockImplementation(() => {})
  vi.mocked(syncGoogleDocs).mockImplementation(async ({logger}) => {
    logger.warn("careful")
    logger.error("broken")
    return {files: [], fetchedCount: 2, imagesCount: 0}
  })
  const options = createOptions()
  delete options.logger

  await withGoogleDocs({}, options)(BUILD, {})

  expect(warn).toHaveBeenCalledWith("google-docs: careful")
  expect(error).toHaveBeenCalledWith("google-docs: broken")
  expect(log).toHaveBeenCalledWith(
    "google-docs: 2 documents fetched, 0 images in public/docs"
  )
  vi.restoreAllMocks()
})

test("stores the paths for the code that reads the documents", async () => {
  const {resolvePaths} = await import("../lib/options.js")
  const options = createOptions()

  expect(resolvePaths()).toEqual({
    outputDir: "content/google-docs",
    publicDir: "public/google-docs",
  })

  await withGoogleDocs({}, options)("phase-production-server", {})

  expect(resolvePaths()).toEqual({
    outputDir: options.outputDir,
    publicDir: "public/docs",
  })
  expect(resolvePaths({outputDir: "other"})).toEqual({
    outputDir: "other",
    publicDir: "public/docs",
  })
})

test("turns the public directory into a url path", async () => {
  const {getPublicPath} = await import("../lib/options.js")

  expect(getPublicPath("public")).toBe("")
  expect(getPublicPath("public/docs")).toBe("/docs")
  expect(() => getPublicPath("static")).toThrow(
    '"publicDir" must be inside "public", got "static"'
  )
})
