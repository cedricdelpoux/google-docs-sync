const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const {afterEach, beforeEach, test} = require("node:test")
const {OAuth2Client} = require("google-auth-library")

const {loadFresh, mockAnswers, mockSpawn} = require("./mocks")

const TOKENS = {access_token: "ya29", refresh_token: "1//0g"}
const initialDir = process.cwd()

beforeEach((t) => {
  t.mock.method(console, "log", () => {})
  process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), "new-token-")))
})

afterEach(() => {
  process.chdir(initialDir)
})

const authorize = (query) => (command, args) => {
  const url = new URL(args[0])
  if (url.hostname === "accounts.google.com") {
    const redirectUri = url.searchParams.get("redirect_uri")
    fetch(`${redirectUri}?${query}`).catch(() => {})
  }
}

const mockGetToken = (t, tokens = TOKENS) =>
  t.mock.method(OAuth2Client.prototype, "getToken", async () => ({tokens}))

const options = (overrides) => ({
  clientId: "id",
  clientSecret: "secret",
  scope: ["https://www.googleapis.com/auth/documents.readonly"],
  tokenName: "TEST_TOKEN",
  apisToEnable: [],
  port: 0,
  ...overrides,
})

test("exchanges the code with the PKCE verifier and stores the token", async (t) => {
  const spawn = mockSpawn(t, authorize("code=4%2F0Ae"))
  const getToken = mockGetToken(t)
  const {getNewToken} = loadFresh("utils/get-new-token.js")

  assert.deepEqual(await getNewToken(options()), TOKENS)

  const authUrl = new URL(spawn.mock.calls[0].arguments[1][0])
  const redirectUri = authUrl.searchParams.get("redirect_uri")
  assert.match(redirectUri, /^http:\/\/localhost:\d+\/callback$/)
  assert.equal(authUrl.searchParams.get("client_id"), "id")
  assert.equal(authUrl.searchParams.get("access_type"), "offline")
  assert.equal(authUrl.searchParams.get("prompt"), "consent")
  assert.equal(authUrl.searchParams.get("code_challenge_method"), "S256")

  const params = getToken.mock.calls[0].arguments[0]
  assert.equal(params.code, "4/0Ae")
  assert.equal(params.redirect_uri, redirectUri)
  assert.ok(params.codeVerifier)
  assert.equal(
    fs.readFileSync(".env", "utf8"),
    `TEST_TOKEN=${JSON.stringify(TOKENS)}\n`
  )
})

test("does not write the token when there is no token name", async (t) => {
  mockSpawn(t, authorize("code=abc"))
  mockGetToken(t)
  const {getNewToken} = loadFresh("utils/get-new-token.js")

  assert.deepEqual(await getNewToken(options({tokenName: null})), TOKENS)
  assert.equal(fs.existsSync(".env"), false)
})

test("walks through the APIs to enable before authorizing", async (t) => {
  const questions = mockAnswers(t, ["", ""])
  const spawn = mockSpawn(t, authorize("code=abc"))
  mockGetToken(t)
  const {getNewToken} = loadFresh("utils/get-new-token.js")

  await getNewToken(
    options({apisToEnable: ["docs.googleapis.com", "drive.googleapis.com"]})
  )

  const urls = spawn.mock.calls.map((call) => call.arguments[1][0])
  assert.match(urls[0], /enableapi\?apiid=docs\.googleapis\.com$/)
  assert.match(urls[1], /enableapi\?apiid=drive\.googleapis\.com$/)
  assert.match(urls[2], /^https:\/\/accounts\.google\.com\//)
  assert.equal(questions.length, 2)
})

test("rejects when the authorization is denied and writes nothing", async (t) => {
  mockSpawn(t, authorize("error=access_denied"))
  const getToken = mockGetToken(t)
  const {getNewToken} = loadFresh("utils/get-new-token.js")

  await assert.rejects(getNewToken(options()), {
    message: "Authorization failed: access_denied",
  })
  assert.equal(getToken.mock.callCount(), 0)
  assert.equal(fs.existsSync(".env"), false)
})
