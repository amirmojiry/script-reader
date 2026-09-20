import { describe, expect, it } from 'vitest'
import { bundledPlays } from '../src/data/bundledPlays'
import {
  DEATH_KNOCKS_BUNDLED_ID,
  SOCRATES_BUNDLED_ID,
  woodyAllenBundledPlays,
  woodyAllenSources
} from '../src/data/woodyAllen'
import type { DialogueBlock } from '../src/types'
import { dialogueCharacterIds, dialogueText, flattenBlocks, validatePlay } from '../src/utils/play'

const expectedCounts = [201, 102]

describe('Woody Allen bundled plays', () => {
  it('preserves every reviewed source record in canonical order and with correct ownership', () => {
    expect(woodyAllenBundledPlays).toHaveLength(2)

    woodyAllenSources.forEach((source, playIndex) => {
      const play = woodyAllenBundledPlays[playIndex]
      const blocks = flattenBlocks(play)

      expect(validatePlay(play)).toEqual({ valid: true, errors: [] })
      expect(play.title).toBe(source.title)
      expect(play.author).toBe('وودی آلن')
      expect(play.translator).toBe('حسین یعقوبی')
      expect(blocks).toHaveLength(expectedCounts[playIndex])
      expect(blocks).toHaveLength(source.records.length)

      source.records.forEach((record, recordIndex) => {
        const block = blocks[recordIndex]
        expect(block.id).toBe(`block-${String(recordIndex + 1).padStart(4, '0')}`)

        if (record[0] === 's') {
          expect(block).toEqual({ id: block.id, type: 'stage-direction', text: record[1] })
          return
        }

        expect(block.type).toBe('dialogue')
        const dialogue = block as DialogueBlock
        const expectedNames = Array.isArray(record[1]) ? record[1] : [record[1]]
        const ownerNames = dialogueCharacterIds(dialogue).map((characterId) =>
          play.characters.find((character) => character.id === characterId)?.name
        )
        expect(ownerNames).toEqual(expectedNames)
        expect(dialogue.parts).toEqual([{ type: 'speech', text: record[2] }])
        expect(dialogueText(dialogue)).toBe(record[2])
      })
    })
  })

  it('uses joint ownership for the two simultaneous Simmias/Agathon lines without a synthetic role', () => {
    const socrates = woodyAllenBundledPlays[1]
    expect(socrates.characters.map((character) => character.name)).not.toContain('سیمیاس و آگاتن')

    const joint = flattenBlocks(socrates).filter((block): block is DialogueBlock =>
      block.type === 'dialogue' && (block.characterIds?.length ?? 0) > 1
    )
    expect(joint).toHaveLength(2)
    for (const block of joint) {
      expect(dialogueCharacterIds(block).map((id) => socrates.characters.find((character) => character.id === id)?.name))
        .toEqual(['سیمیاس', 'آگاتن'])
    }
  })

  it('is exposed in the bundled catalog with reserved unique ids and discovery metadata', () => {
    expect(woodyAllenBundledPlays.map((play) => play.id)).toEqual([
      DEATH_KNOCKS_BUNDLED_ID,
      SOCRATES_BUNDLED_ID
    ])

    for (const play of woodyAllenBundledPlays) {
      expect(play.id.startsWith('builtin:')).toBe(true)
      expect(play.genres).toEqual(['کمدی', 'فلسفی'])
      expect(play.characters.every((character) => ['male', 'female', 'unknown'].includes(character.gender ?? ''))).toBe(true)
      expect(bundledPlays.some((candidate) => candidate.id === play.id)).toBe(true)
    }

    expect(new Set(bundledPlays.map((play) => play.id)).size).toBe(bundledPlays.length)
  })
})
