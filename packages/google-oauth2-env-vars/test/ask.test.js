const assert = require("node:assert/strict")
const {test} = require("node:test")

const {loadFresh, mockAnswers} = require("./mocks")

test("ask trims the answer and prints the question", async (t) => {
  const questions = mockAnswers(t, ["  value \n"])
  const {ask} = loadFresh("utils/ask.js")

  assert.equal(await ask("Name: "), "value")
  assert.deepEqual(questions, ["Name: "])
})

test("ask closes the prompt when the question fails", async (t) => {
  const readline = require("node:readline/promises")
  const close = t.mock.fn()
  t.mock.method(readline, "createInterface", () => ({
    question: async () => {
      throw new Error("aborted")
    },
    close,
  }))
  const {ask} = loadFresh("utils/ask.js")

  await assert.rejects(ask("Name: "), {message: "aborted"})
  assert.equal(close.mock.callCount(), 1)
})

test("askRequired asks again until the answer is not empty", async (t) => {
  const questions = mockAnswers(t, ["", "   ", "secret"])
  const {askRequired} = loadFresh("utils/ask.js")

  assert.equal(await askRequired("Secret: "), "secret")
  assert.equal(questions.length, 3)
})
