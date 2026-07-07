import { describe, expect, it } from 'vitest'
import { tierForScore } from './tiers'

describe('tierForScore', () => {
  it('maps boundary scores to the correct tier', () => {
    expect(tierForScore(0).tier).toBe('low')
    expect(tierForScore(20).tier).toBe('low')
    expect(tierForScore(21).tier).toBe('elevated')
    expect(tierForScore(50).tier).toBe('elevated')
    expect(tierForScore(51).tier).toBe('high')
    expect(tierForScore(75).tier).toBe('high')
    expect(tierForScore(76).tier).toBe('critical')
    expect(tierForScore(100).tier).toBe('critical')
  })

  it('clamps out-of-range scores', () => {
    expect(tierForScore(-5).tier).toBe('low')
    expect(tierForScore(150).tier).toBe('critical')
  })
})
