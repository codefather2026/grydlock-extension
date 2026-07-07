import { WINDOW_REQUEST_TYPE, WINDOW_RESPONSE_TYPE, type Outcome } from './protocol'

type SignTransactionFn = (xdr: string, opts?: unknown) => Promise<unknown>
type WrappedSignTransaction = SignTransactionFn & { __grydlockWrapped?: boolean }

interface FreighterApi {
  signTransaction?: WrappedSignTransaction
  [key: string]: unknown
}

/**
 * Asks the isolated-world bridge (and, behind it, the background worker) to
 * decode and score this xdr and return an outcome. Decoding and scoring
 * happen off the page — this script stays a thin proxy so it doesn't ship
 * the Stellar SDK into every page it runs on.
 */
function requestOutcome(xdr: string): Promise<Outcome> {
  const requestId = crypto.randomUUID()

  return new Promise((resolve) => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window) return
      const data = event.data as { type?: string; requestId?: string; outcome?: string } | undefined
      if (data?.type !== WINDOW_RESPONSE_TYPE || data.requestId !== requestId) return
      window.removeEventListener('message', onMessage)
      const outcome = data.outcome
      resolve(outcome === 'proceed' || outcome === 'allow' ? outcome : 'cancel')
    }
    window.addEventListener('message', onMessage)
    window.postMessage({ type: WINDOW_REQUEST_TYPE, requestId, xdr }, '*')
  })
}

function wrap(api: FreighterApi) {
  const original = api.signTransaction
  if (typeof original !== 'function' || original.__grydlockWrapped) return

  const guarded: WrappedSignTransaction = async (xdr, opts) => {
    const outcome = await requestOutcome(xdr)
    if (outcome === 'cancel') {
      throw new Error('Rejected by Gryd Lock: user cancelled after reviewing the risk warning.')
    }
    return original.call(api, xdr, opts)
  }
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
