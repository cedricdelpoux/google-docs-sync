const assert = require("node:assert/strict")
const {test} = require("node:test")

const {loadFresh} = require("./mocks")

const mockLoadEnvFile = (t, code) =>
  t.mock.method(process, "loadEnvFile", () => {
    throw Object.assign(new Error("loadEnvFile failed"), {code})
  })

test("loads the module when there is no .env file", (t) => {
  mockLoadEnvFile(t, "ENOENT")

  assert.equal(typeof loadFresh("index.js"), "function")
})

test("rethrows the error of a .env file that cannot be loaded", (t) => {
  mockLoadEnvFile(t, "EACCES")

  assert.throws(() => loadFresh("index.js"), {message: "loadEnvFile failed"})
})

test("has no token, scope or fixed port without options", (t) => {
  mockLoadEnvFile(t, "ENOENT")
  const GoogleOAuth2 = loadFresh("index.js")

  assert.deepEqual(
    {...new GoogleOAuth2()},
    {tokenName: null, scope: null, apisToEnable: [], port: 0}
  )
})
