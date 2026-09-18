import { describe, expect, it } from 'vitest'
import { bundledPlays } from '../src/data/bundledPlays'

describe('bundled discovery metadata', () => {
  it('defines genres and explicit gender metadata for every bundled play and character', () => {
    expect(bundledPlays.length).toBeGreaterThan(0)

    for (const play of bundledPlays) {
      expect(play.genres?.length).toBeGreaterThan(0)
      for (const character of play.characters) {
        expect(['male', 'female', 'unknown']).toContain(character.gender)
      }
    }
  })
})
