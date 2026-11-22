const assert = require("node:assert/strict")
const childProcess = require("node:child_process")
const {beforeEach, test} = require("node:test")

const {loadFresh, mockSpawn} = require("./mocks")

const URL_WITH_AND = "https://example.com/auth?a=1&b=2"

beforeEach((t) => {
  t.mock.method(console, "log", () => {})
})

const openOn = (t, platform) => {
  const original = Object.getOwnPropertyDescriptor(process, "platform")
  Object.defineProperty(process, "platform", {value: platform})
  t.after(() => Object.defineProperty(process, "platform", original))
  const spawn = mockSpawn(t)
  const {openUrl} = loadFresh("utils/open-url.js")
  openUrl({message: "URL:", url: URL_WITH_AND})
  return spawn.mock.calls[0].arguments
}

test("prints the url", (t) => {
  mockSpawn(t)
  const {openUrl} = loadFresh("utils/open-url.js")

  openUrl({message: "URL:", url: URL_WITH_AND})

  const lines = console.log.mock.calls.map((call) => call.arguments[0])
  assert.ok(lines.includes(`🔗  URL: ${URL_WITH_AND}`))
})

test("opens the url with open on macOS", (t) => {
  const [command, args, options] = openOn(t, "darwin")

  assert.equal(command, "open")
  assert.deepEqual(args, [URL_WITH_AND])
  assert.equal(options.detached, true)
})

test("opens the url with xdg-open on Linux", (t) => {
  const [command, args] = openOn(t, "linux")

  assert.equal(command, "xdg-open")
  assert.deepEqual(args, [URL_WITH_AND])
})

test("quotes the url on Windows so that cmd keeps the ampersand", (t) => {
  const [command, args] = openOn(t, "win32")

  assert.equal(command, "cmd")
  assert.deepEqual(args, ["/c", "start", '""', `"${URL_WITH_AND}"`])
})

test("does not throw when the browser cannot be launched", (t) => {
  t.mock.method(childProcess, "spawn", () => {
    throw new Error("spawn failed")
  })
  const {openUrl} = loadFresh("utils/open-url.js")

  assert.doesNotThrow(() => openUrl({message: "URL:", url: URL_WITH_AND}))
})

test("ignores the error event of the browser process", (t) => {
  const child = {on: t.mock.fn(), unref: t.mock.fn()}
  t.mock.method(childProcess, "spawn", () => child)
  const {openUrl} = loadFresh("utils/open-url.js")

  openUrl({message: "URL:", url: URL_WITH_AND})

  const [event, listener] = child.on.mock.calls[0].arguments
  assert.equal(event, "error")
  assert.doesNotThrow(() => listener(new Error("ENOENT")))
  assert.equal(child.unref.mock.callCount(), 1)
})
