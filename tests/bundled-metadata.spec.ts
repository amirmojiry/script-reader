import { describe, expect, it } from 'vitest'
import { bundledPlays } from '../src/data/bundledPlays'
import type { DialogueBlock } from '../src/types'
import { dialogueCharacterIds, flattenBlocks } from '../src/utils/play'

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
  it('does not expose characters without dialogue in any bundled play', () => {
    expect(bundledPlays.length).toBeGreaterThan(0)

    for (const play of bundledPlays) {
      const speakingCharacterIds = new Set(
        flattenBlocks(play)
          .filter((block): block is DialogueBlock => block.type === 'dialogue')
          .flatMap((dialogue) => dialogueCharacterIds(dialogue))
      )
      const silentCharacters = play.characters
        .filter((character) => !speakingCharacterIds.has(character.id))
        .map((character) => ({ id: character.id, name: character.name }))

      expect(silentCharacters, play.id).toEqual([])
    }
  })

})
