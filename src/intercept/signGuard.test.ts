import { describe, expect, it, vi } from 'vitest'
import { createSignGuard } from './signGuard'

describe('createSignGuard', () => {
  it('passes through untouched when no destination can be determined', async () => {
    const original = vi.fn().mockResolvedValue({ signedTxXdr: 'signed' })
    const getScore = vi.fn()
    const requestDecision = vi.fn()
    const guard = createSignGuard(
      { extractDestination: () => null, getScore, requestDecision },
      original,
    )

    const result = await guard('some-xdr', { network: 'TESTNET' })

    expect(result).toEqual({ signedTxXdr: 'signed' })
    expect(original).toHaveBeenCalledWith('some-xdr', { network: 'TESTNET' })
    expect(getScore).not.toHaveBeenCalled()
    expect(requestDecision).not.toHaveBeenCalled()
  })

  it('scores the destination, requests a decision, and signs when the user proceeds', async () => {
    const original = vi.fn().mockResolvedValue({ signedTxXdr: 'signed' })
    const getScore = vi.fn().mockResolvedValue(42)
    const requestDecision = vi.fn().mockResolvedValue('proceed')
    const guard = createSignGuard(
      {
        extractDestination: () => ({ destination: 'GDEST', asset: 'USD:GISSUER' }),
        getScore,
        requestDecision,
      },
      original,
    )

    const result = await guard('some-xdr')

    expect(getScore).toHaveBeenCalledWith('GDEST')
    expect(requestDecision).toHaveBeenCalledWith({ destination: 'GDEST', asset: 'USD:GISSUER', score: 42 })
    expect(result).toEqual({ signedTxXdr: 'signed' })
  })

  it('rejects and never signs when the user cancels', async () => {
    const original = vi.fn()
    const guard = createSignGuard(
      {
        extractDestination: () => ({ destination: 'GDEST' }),
        getScore: async () => 90,
        requestDecision: async () => 'cancel',
      },
      original,
    )

    await expect(guard('some-xdr')).rejects.toThrow(/cancelled/i)
    expect(original).not.toHaveBeenCalled()
  })

  it('propagates a rejection from the original signTransaction', async () => {
    const original = vi.fn().mockRejectedValue(new Error('user rejected in Freighter'))
    const guard = createSignGuard(
      {
        extractDestination: () => ({ destination: 'GDEST' }),
        getScore: async () => 5,
        requestDecision: async () => 'proceed',
      },
      original,
    )

    await expect(guard('some-xdr')).rejects.toThrow('user rejected in Freighter')
  })
})
