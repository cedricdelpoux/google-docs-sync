const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const {afterEach, beforeEach, test} = require("node:test")
const {OAuth2Client} = require("google-auth-library")

const {loadFresh, mockAnswers, mockSpawn} = require("./mocks")

const TOKENS = {
  access_token: "ya29",
  refresh_token: "1//0g",
  scope: "https://www.googleapis.com/auth/documents.readonly",
  token_type: "Bearer",
  expiry_date: 1700000000000,
}
const initialDir = process.cwd()

beforeEach((t) => {
  t.mock.method(console, "log", () => {})
  t.mock.method(console, "info", () => {})
  t.mock.method(console, "error", () => {})
  delete process.env.GOOGLE_OAUTH_CLIENT_ID
  delete process.env.GOOGLE_OAUTH_CLIENT_SECRET
  delete process.env.TEST_TOKEN
  process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), "new-env-vars-")))
  mockSpawn(t, (command, args) => {
    const url = new URL(args[0])
    if (url.hostname === "accounts.google.com") {
      const redirectUri = url.searchParams.get("redirect_uri")
      fetch(`${redirectUri}?code=abc`).catch(() => {})
    }
  })
  t.mock.method(OAuth2Client.prototype, "getToken", async () => ({
    tokens: TOKENS,
  }))
})

afterEach(() => {
  process.chdir(initialDir)
  process.exitCode = undefined
  delete process.env.GOOGLE_OAUTH_CLIENT_ID
  delete process.env.GOOGLE_OAUTH_CLIENT_SECRET
  delete process.env.TEST_TOKEN
})

const load = (options) => {
  const GoogleOAuth2 = loadFresh("index.js")
  return new GoogleOAuth2(options)
}

test("getNewEnvVars requires a scope", async () => {
  await assert.rejects(load({token: "TEST_TOKEN"}).getNewEnvVars(), {
    message: "You need to define `scope` in GoogleOAuth2 constructor",
  })
})

test("getNewEnvVars returns the client ids and the new token", async (t) => {
  mockAnswers(t, ["my-id", "my-secret"])
  const googleOAuth2 = load({token: "TEST_TOKEN", scope: ["docs"]})

  assert.deepEqual(await googleOAuth2.getNewEnvVars(), {
    GOOGLE_OAUTH_CLIENT_ID: "my-id",
    GOOGLE_OAUTH_CLIENT_SECRET: "my-secret",
    TEST_TOKEN: TOKENS,
  })
  assert.equal(
    fs.readFileSync(".env", "utf8"),
    "GOOGLE_OAUTH_CLIENT_ID=my-id\n" +
      "GOOGLE_OAUTH_CLIENT_SECRET=my-secret\n" +
      `TEST_TOKEN=${JSON.stringify(TOKENS)}\n`
  )
})

test("generateEnvVars returns the variables already in the environment", async () => {
  process.env.GOOGLE_OAUTH_CLIENT_ID = "id"
  process.env.GOOGLE_OAUTH_CLIENT_SECRET = "secret"
  process.env.TEST_TOKEN = JSON.stringify(TOKENS)
  const googleOAuth2 = load({token: "TEST_TOKEN"})

  assert.deepEqual(await googleOAuth2.generateEnvVars(), {
    GOOGLE_OAUTH_CLIENT_ID: "id",
    GOOGLE_OAUTH_CLIENT_SECRET: "secret",
    TEST_TOKEN: TOKENS,
  })
  const lines = console.log.mock.calls.map((call) => call.arguments[0])
  assert.ok(lines.includes("✅  TEST_TOKEN found in .env"))
  assert.equal(process.exitCode, undefined)
})

test("generateEnvVars generates the missing variables", async (t) => {
  mockAnswers(t, ["my-id", "my-secret"])
  const googleOAuth2 = load({token: "TEST_TOKEN", scope: ["docs"]})

  const envVars = await googleOAuth2.generateEnvVars()

  assert.equal(envVars.GOOGLE_OAUTH_CLIENT_ID, "my-id")
  assert.deepEqual(envVars.TEST_TOKEN, TOKENS)
  const lines = console.log.mock.calls.map((call) => call.arguments[0])
  assert.ok(lines.includes("❌  GOOGLE_OAUTH_CLIENT_ID not found in .env"))
  assert.equal(process.exitCode, undefined)
})
