const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const {afterEach, beforeEach, test} = require("node:test")

const {loadFresh, mockAnswers, mockSpawn} = require("./mocks")

const initialDir = process.cwd()

beforeEach((t) => {
  t.mock.method(console, "log", () => {})
  t.mock.method(console, "info", () => {})
  delete process.env.GOOGLE_OAUTH_CLIENT_ID
  delete process.env.GOOGLE_OAUTH_CLIENT_SECRET
  process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), "ask-client-ids-")))
})

afterEach(() => {
  process.chdir(initialDir)
  delete process.env.GOOGLE_OAUTH_CLIENT_ID
  delete process.env.GOOGLE_OAUTH_CLIENT_SECRET
})

test("returns the ids found in the environment without asking", async (t) => {
  process.env.GOOGLE_OAUTH_CLIENT_ID = "env-id"
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "env-secret"
  const spawn = mockSpawn(t)
  const {askClientIds} = loadFresh("utils/ask-client-ids.js")

  assert.deepEqual(await askClientIds({port: 0}), {
    clientId: "env-id",
    clientSecret: "env-secret",
  })
  assert.equal(spawn.mock.callCount(), 0)
  assert.equal(fs.existsSync(".env"), false)
})

test("asks for the ids, opens the console and writes them to .env", async (t) => {
  const questions = mockAnswers(t, ["", "my-id", " my-secret "])
  const spawn = mockSpawn(t)
  const {askClientIds} = loadFresh("utils/ask-client-ids.js")

  assert.deepEqual(await askClientIds({port: 0}), {
    clientId: "my-id",
    clientSecret: "my-secret",
  })
  assert.deepEqual(questions, ["Client ID: ", "Client ID: ", "Client Secret: "])
  assert.match(spawn.mock.calls[0].arguments[1][0], /oauthclient$/)
  assert.equal(
    fs.readFileSync(".env", "utf8"),
    "GOOGLE_OAUTH_CLIENT_ID=my-id\nGOOGLE_OAUTH_CLIENT_SECRET=my-secret\n"
  )
})

test("mentions the redirect uri of a Web application client when a port is given", async (t) => {
  mockAnswers(t, ["id", "secret"])
  mockSpawn(t)
  const {askClientIds} = loadFresh("utils/ask-client-ids.js")

  await askClientIds({port: 8080})

  const hints = console.info.mock.calls.map((call) => call.arguments[0])
  assert.ok(
    hints.some((hint) => hint.includes("http://localhost:8080/callback"))
  )
})

test("does not mention a redirect uri without a port", async (t) => {
  mockAnswers(t, ["id", "secret"])
  mockSpawn(t)
  const {askClientIds} = loadFresh("utils/ask-client-ids.js")

  await askClientIds({port: 0})

  const hints = console.info.mock.calls.map((call) => call.arguments[0])
  assert.ok(!hints.some((hint) => hint.includes("/callback")))
})
