import { createSignGuard, type SignTransactionFn } from './signGuard'
import { extractDestination } from '../decode/decodeTransaction'
import { getScore } from '../adapter/oracleAdapter'
import { WINDOW_REQUEST_TYPE, WINDOW_RESPONSE_TYPE, type Decision } from './protocol'

function requestDecision(info: { destination: string; asset?: string; score: number }): Promise<Decision> {
  const requestId = crypto.randomUUID()

  return new Promise((resolve) => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window) return
      const data = event.data as { type?: string; requestId?: string; decision?: string } | undefined
      if (data?.type !== WINDOW_RESPONSE_TYPE || data.requestId !== requestId) return
      window.removeEventListener('message', onMessage)
      resolve(data.decision === 'proceed' ? 'proceed' : 'cancel')
    }
    window.addEventListener('message', onMessage)
    window.postMessage({ type: WINDOW_REQUEST_TYPE, requestId, ...info }, '*')
  })
}

type WrappedSignTransaction = SignTransactionFn & { __grydlockWrapped?: boolean }

interface FreighterApi {
  signTransaction?: WrappedSignTransaction
  [key: string]: unknown
}

function wrap(api: FreighterApi) {
  const original = api.signTransaction
  if (typeof original !== 'function' || original.__grydlockWrapped) return

  const guarded = createSignGuard(
    { extractDestination, getScore, requestDecision },
    original.bind(api),
  ) as WrappedSignTransaction
  guarded.__grydlockWrapped = true
  api.signTransaction = guarded
}

declare global {
  interface Window {
    freighterApi?: FreighterApi
  }
}

const existing = window.freighterApi
if (existing) {
  wrap(existing)
} else {
  let backing: FreighterApi | undefined
  Object.defineProperty(window, 'freighterApi', {
    configurable: true,
    get() {
      return backing
    },
    set(value: FreighterApi | undefined) {
      if (value) wrap(value)
      backing = value
    },
  })
}
