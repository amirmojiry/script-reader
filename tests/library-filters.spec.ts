import { describe, expect, it } from 'vitest'
import type { Play } from '../src/types'
import { matchesLibraryRanges, numericBounds, playLibraryMetrics } from '../src/utils/library'

function makePlay(characterCount: number, spokenWords: number): Play {
  const characters = Array.from({ length: characterCount }, (_, index) => ({
    id: `c-${index + 1}`,
    name: `شخصیت ${index + 1}`
  }))
  const text = Array.from({ length: spokenWords }, () => 'واژه').join(' ')
  return {
    id: `play-${characterCount}-${spokenWords}`,
    title: 'تست',
    characters,
    acts: [{
      id: 'act-1',
      title: 'پرده',
      scenes: [{
        id: 'scene-1',
        title: 'صحنه',
        blocks: [{ id: 'block-1', type: 'dialogue', characterId: characters[0].id, parts: [{ type: 'speech', text }] }]
      }]
    }]
  }
}

describe('library filters', () => {
  it('derives character count and rounded estimated minutes from the same play metrics', () => {
    const metrics = playLibraryMetrics(makePlay(5, 261))
    expect(metrics).toMatchObject({ characterCount: 5, dialogueCount: 1, spokenWordCount: 261, estimatedMinutes: 3 })
  })

  it('builds dynamic slider bounds from available metrics', () => {
    expect(numericBounds([5, 8, 3, 5])).toEqual({ min: 3, max: 8 })
    expect(numericBounds([])).toEqual({ min: 0, max: 0 })
  })

  it('requires both character and duration ranges to match', () => {
    const metrics = playLibraryMetrics(makePlay(5, 260))
    expect(matchesLibraryRanges(metrics, { characterMin: 4, characterMax: 6, durationMin: 1, durationMax: 3 })).toBe(true)
    expect(matchesLibraryRanges(metrics, { characterMin: 6, characterMax: 8, durationMin: 1, durationMax: 3 })).toBe(false)
    expect(matchesLibraryRanges(metrics, { characterMin: 4, characterMax: 6, durationMin: 3, durationMax: 5 })).toBe(false)
  })
})
