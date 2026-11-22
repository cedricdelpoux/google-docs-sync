import {expect, test, vi} from "vitest"
import {z} from "astro/zod"

import {createGoogleDocsSchema} from "../index.js"

const DATA = {
  id: "doc-1",
  name: "Home",
  slug: "/",
  path: "/home",
  date: "2021-01-30T09:40:52.702Z",
  createdTime: "2021-01-30T09:40:52.702Z",
  modifiedTime: "2021-01-30T09:40:52.702Z",
  breadcrumb: [{name: "Home", slug: "/"}],
  cover: {image: "images/index/cover.png"},
}

test("keeps the cover image as a path by default", () => {
  const {cover} = createGoogleDocsSchema().parse(DATA)

  expect(cover.image).toBe("images/index/cover.png")
})

test("validates the cover image with the image helper of the collection", () => {
  const image = vi.fn(() => z.string().transform((path) => `asset:${path}`))

  const {cover} = createGoogleDocsSchema({image}).parse(DATA)

  expect(cover.image).toBe("asset:images/index/cover.png")
})
