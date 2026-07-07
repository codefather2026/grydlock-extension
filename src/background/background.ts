import type { RuntimeDecisionMadeMessage, RuntimeRequestDecisionMessage } from '../intercept/protocol'

type IncomingMessage = RuntimeRequestDecisionMessage | RuntimeDecisionMadeMessage

const pendingResolvers = new Map<string, (message: RuntimeDecisionMadeMessage) => void>()

chrome.runtime.onMessage.addListener((message: IncomingMessage, _sender, sendResponse) => {
  if (message.type === 'REQUEST_DECISION') {
    pendingResolvers.set(message.requestId, sendResponse)

    const params = new URLSearchParams({
      mode: 'intercept',
      requestId: message.requestId,
      destination: message.destination,
      score: String(message.score),
    })
    if (message.asset) params.set('asset', message.asset)

    chrome.windows.create({
      url: chrome.runtime.getURL(`src/popup/index.html?${params.toString()}`),
      type: 'popup',
      width: 320,
      height: 420,
    })

    return true
  }

  if (message.type === 'DECISION_MADE') {
    const resolve = pendingResolvers.get(message.requestId)
    resolve?.(message)
    pendingResolvers.delete(message.requestId)
  }

  return undefined
})
