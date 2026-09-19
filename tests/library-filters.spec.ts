import { describe, expect, it } from 'vitest'
import type { CharacterGender, Play } from '../src/types'
import { characterGender } from '../src/utils/play'
import {
  matchesLibraryRanges,
  matchesWizardCriteria,
  numericBounds,
  playGenres,
  playLibraryMetrics,
  sortPlayCards
} from '../src/utils/library'

function makePlay(
  characterCount: number,
  spokenWords: number,
  genders: CharacterGender[] = [],
  title = 'تست',
  genres: string[] = ['درام']
): Play {
  const characters = Array.from({ length: characterCount }, (_, index) => ({
    id: `c-${index + 1}`,
    name: `شخصیت ${index + 1}`,
    gender: genders[index]
  }))
  const text = Array.from({ length: spokenWords }, () => 'واژه').join(' ')
  return {
    id: `play-${characterCount}-${spokenWords}-${title}`,
    title,
    genres,
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

  it('normalizes malformed legacy discovery metadata safely', () => {
    const arrayGenres = makePlay(1, 10) as unknown as { genres: unknown }
    arrayGenres.genres = ['درام', 123, '  کمدی  ']
    expect(playGenres(arrayGenres as unknown as Play)).toEqual(['درام', 'کمدی'])

    const scalarGenres = makePlay(1, 10) as unknown as { genres: unknown }
    scalarGenres.genres = 'درام'
    expect(playGenres(scalarGenres as unknown as Play)).toEqual([])

    expect(characterGender('other')).toBe('unknown')
    expect(characterGender(undefined)).toBe('unknown')
  })

  it('counts explicit genders and treats missing metadata as unknown', () => {
    const play = makePlay(4, 100, ['male', 'female', 'unknown'])
    expect(playLibraryMetrics(play)).toMatchObject({
      maleCount: 1,
      femaleCount: 1,
      unknownCount: 2
    })
  })

  it('matches wizard availability, time, and genre constraints', () => {
    const play = makePlay(4, 130, ['male', 'male', 'female', 'unknown'], 'نمایش', ['درام'])
    const metrics = playLibraryMetrics(play)

    expect(matchesWizardCriteria(play, metrics, {
      totalPeople: 4,
      malePeople: 2,
      femalePeople: 1,
      maxMinutes: 5,
      genres: ['درام']
    })).toBe(true)

    expect(matchesWizardCriteria(play, metrics, {
      totalPeople: 4,
      malePeople: 1,
      femalePeople: 2,
      maxMinutes: 5,
      genres: ['درام']
    })).toBe(false)

    expect(matchesWizardCriteria(play, metrics, {
      totalPeople: 4,
      malePeople: 2,
      femalePeople: 1,
      maxMinutes: 5,
      genres: ['کمدی']
    })).toBe(false)

    expect(matchesWizardCriteria(play, metrics, {
      totalPeople: 4,
      malePeople: 2,
      femalePeople: 1,
      maxMinutes: 5,
      genres: ['کمدی', 'درام']
    })).toBe(true)
  })

  it('sorts by title, duration, and role count', () => {
    const cards = [
      { play: makePlay(5, 260, [], 'ب'), metrics: playLibraryMetrics(makePlay(5, 260, [], 'ب')) },
      { play: makePlay(2, 130, [], 'آ'), metrics: playLibraryMetrics(makePlay(2, 130, [], 'آ')) }
    ]

    expect(sortPlayCards(cards, 'title-asc')[0].play.title).toBe('آ')
    expect(sortPlayCards(cards, 'duration-asc')[0].metrics.estimatedMinutes).toBe(1)
    expect(sortPlayCards(cards, 'roles-desc')[0].metrics.characterCount).toBe(5)
  })
})
