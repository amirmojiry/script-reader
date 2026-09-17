import { describe, expect, it } from 'vitest'
import { timelinePositionPercent } from '../src/utils/timeline'

describe('RTL character timeline', () => {
  it('maps early dialogue indexes near the right edge and later indexes toward the left', () => {
    expect(timelinePositionPercent(0, 100)).toBe(0)
    expect(timelinePositionPercent(10, 100)).toBe(10)
    expect(timelinePositionPercent(90, 100)).toBe(90)
  })

  it('clamps the marker inside the timeline', () => {
    expect(timelinePositionPercent(200, 100)).toBe(99)
  })
})
