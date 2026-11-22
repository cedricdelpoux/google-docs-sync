const childProcess = require("node:child_process")
const path = require("node:path")
const readline = require("node:readline/promises")

const packageRoot = path.resolve(__dirname, "..")

// The utils destructure what they import, so they are loaded after the mocks
const loadFresh = (file) => {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(packageRoot) && !key.startsWith(__dirname)) {
      delete require.cache[key]
    }
  }
  return require(path.join(packageRoot, file))
}

const mockAnswers = (t, answers) => {
  const questions = []
  t.mock.method(readline, "createInterface", () => ({
    question: async (question) => {
      questions.push(question)
      return answers.shift()
    },
    close: () => {},
  }))
  return questions
}

const mockSpawn = (t, onSpawn = () => {}) => {
  const spawn = t.mock.method(childProcess, "spawn", (command, args) => {
    onSpawn(command, args)
    return {on: () => {}, unref: () => {}}
  })
  return spawn
}

module.exports = {loadFresh, mockAnswers, mockSpawn}
