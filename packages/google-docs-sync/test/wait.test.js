import {afterEach, beforeEach, expect, test, vi} from "vitest"

import {wait} from "../lib/wait.js"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test("lets the requests of the interval through without waiting", async () => {
  const waitRequest = wait(2, 1000)

  expect(await waitRequest()).toBe(0)
  expect(await waitRequest()).toBe(0)
})

test("makes the requests over the interval wait for their share of it", async () => {
  const waitRequest = wait(2, 1000)
  await waitRequest(2)

  const waiting = waitRequest()
  await vi.advanceTimersByTimeAsync(500)

  expect(await waiting).toBe(500)
})

test("refuses more requests at once than the interval allows", async () => {
  await expect(wait(2, 1000)(3)).rejects.toThrow(
    "Requests can not be greater than the number of requests per interval"
  )
})
