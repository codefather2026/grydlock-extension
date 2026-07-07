export interface Decision {
  destination: string
  asset?: string
  score: number
}

export type SignTransactionFn = (xdr: string, opts?: unknown) => Promise<unknown>

export interface SignGuardDeps {
  extractDestination: (xdr: string) => { destination: string; asset?: string } | null
  getScore: (destination: string) => Promise<number>
  requestDecision: (info: Decision) => Promise<'proceed' | 'cancel'>
}

/**
 * Wraps a Freighter-shaped signTransaction so every call is routed through
 * the risk warning first. Transactions with no single determinable
 * destination (malformed XDR, no destination-bearing op, multiple distinct
 * destinations) pass straight through — nothing to score, so nothing to warn
 * about; Gryd Lock never blocks what it can't assess.
 */
export function createSignGuard(
  deps: SignGuardDeps,
  originalSignTransaction: SignTransactionFn,
): SignTransactionFn {
  return async (xdr, opts) => {
    const decoded = deps.extractDestination(xdr)

    if (!decoded) {
      return originalSignTransaction(xdr, opts)
    }

    const score = await deps.getScore(decoded.destination)
    const decision = await deps.requestDecision({
      destination: decoded.destination,
      asset: decoded.asset,
      score,
    })

    if (decision === 'cancel') {
      throw new Error('Rejected by Gryd Lock: user cancelled after reviewing the risk warning.')
    }

    return originalSignTransaction(xdr, opts)
  }
}
