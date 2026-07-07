import {
  WINDOW_REQUEST_TYPE,
  WINDOW_RESPONSE_TYPE,
  type RuntimeDecisionMadeMessage,
  type RuntimeRequestDecisionMessage,
} from './protocol'

window.addEventListener('message', (event) => {
  if (event.source !== window) return
  const data = event.data as
    | { type?: string; requestId?: string; destination?: string; asset?: string; score?: number }
    | undefined
  if (
    data?.type !== WINDOW_REQUEST_TYPE ||
    !data.requestId ||
    !data.destination ||
    typeof data.score !== 'number'
  ) {
    return
  }

  const message: RuntimeRequestDecisionMessage = {
    type: 'REQUEST_DECISION',
    requestId: data.requestId,
    destination: data.destination,
    asset: data.asset,
    score: data.score,
  }

  chrome.runtime.sendMessage(message, (response: RuntimeDecisionMadeMessage | undefined) => {
    window.postMessage(
      { type: WINDOW_RESPONSE_TYPE, requestId: data.requestId, decision: response?.decision ?? 'cancel' },
      '*',
    )
  })
})
