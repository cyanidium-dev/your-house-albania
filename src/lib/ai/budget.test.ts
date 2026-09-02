import { describe, expect, it } from 'vitest'
import { addUsage, EMPTY_USAGE, estimateUsd, usageDocId } from './budget'

describe('estimateUsd', () => {
  it('prices the four token classes at their own rates', () => {
    // 1M of each, so the result is the rate card itself: 2 + 10 + 0.2 + 2.5.
    const usd = estimateUsd({
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      cacheReadTokens: 1_000_000,
      cacheWriteTokens: 1_000_000,
    })
    expect(usd).toBeCloseTo(14.7, 6)
  })

  it('matches the first real dialogue turn measured in the logs', () => {
    // hop 0: 103 in, 588 out, 8744 cache write; hop 1: 863 in, 213 out, 8744 read.
    const usd = estimateUsd({
      inputTokens: 103 + 863,
      outputTokens: 588 + 213,
      cacheReadTokens: 8744,
      cacheWriteTokens: 8744,
    })
    expect(usd).toBeGreaterThan(0.028)
    expect(usd).toBeLessThan(0.034)
  })

  it('is zero for an empty turn', () => {
    expect(estimateUsd(EMPTY_USAGE)).toBe(0)
  })
})

describe('addUsage', () => {
  it('sums hops without mutating the running total', () => {
    const first = addUsage(EMPTY_USAGE, { inputTokens: 100, outputTokens: 50 })
    const second = addUsage(first, { inputTokens: 10, cacheReadTokens: 8000 })
    expect(first).toEqual({
      inputTokens: 100,
      outputTokens: 50,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    })
    expect(second).toEqual({
      inputTokens: 110,
      outputTokens: 50,
      cacheReadTokens: 8000,
      cacheWriteTokens: 0,
    })
  })

  it('treats missing fields as zero', () => {
    expect(addUsage(EMPTY_USAGE, {})).toEqual(EMPTY_USAGE)
  })
})

describe('usageDocId', () => {
  it('buckets by UTC month, zero-padded', () => {
    expect(usageDocId(new Date('2026-09-02T13:00:00Z'))).toBe('ai-usage-2026-09')
    expect(usageDocId(new Date('2026-12-31T23:59:59Z'))).toBe('ai-usage-2026-12')
  })

  it('rolls over on the UTC boundary, not the local one', () => {
    expect(usageDocId(new Date('2026-10-01T00:00:00Z'))).toBe('ai-usage-2026-10')
  })
})
