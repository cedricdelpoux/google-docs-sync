import {setTimeout as sleep} from "node:timers/promises"

function reload(requestsPerInterval, interval, state) {
  const throughput = requestsPerInterval / interval
  const now = Date.now()
  const reloadTime = now - state.lastReload
  const reloadedRequests = reloadTime * throughput
  const newAvailableRequests = state.availableRequests + reloadedRequests

  return {
    ...state,
    lastReload: now,
    availableRequests: Math.min(newAvailableRequests, requestsPerInterval),
  }
}

function wait(requestsPerInterval, interval) {
  const timePerRequest = interval / requestsPerInterval

  let state = {
    lastReload: Date.now(),
    availableRequests: requestsPerInterval,
  }

  async function waitRequest(requests = 1) {
    if (requests > requestsPerInterval) {
      throw new Error(
        "Requests can not be greater than the number of requests per interval"
      )
    }

    state = reload(requestsPerInterval, interval, state)

    const requestsToWait = Math.max(0, requests - state.availableRequests)
    const waitTime = Math.ceil(requestsToWait * timePerRequest)

    state.availableRequests -= requests
    await sleep(waitTime)
    return waitTime
  }

  return waitRequest
}

export {wait}
