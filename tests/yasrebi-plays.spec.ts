import { describe, expect, it } from 'vitest'
import { bundledPlay } from '../src/data/bundledPlay'
import { bundledPlays, mergeBundledPlay } from '../src/data/bundledPlays'
import { yasrebiAuthor, yasrebiBundledPlays, yasrebiSources } from '../src/data/yasrebi'
import type { DialogueBlock, Play } from '../src/types'
import { dialogueText, flattenBlocks, validatePlay } from '../src/utils/play'

const expectedCounts = [456, 254, 589]

describe('Yasrebi bundled plays', () => {
  it('converts every supplied record into valid canonical play data without changing order or text', () => {
    expect(yasrebiBundledPlays).toHaveLength(3)

    yasrebiSources.forEach((source, playIndex) => {
      const play = yasrebiBundledPlays[playIndex]
      const blocks = flattenBlocks(play)

      expect(validatePlay(play)).toEqual({ valid: true, errors: [] })
      expect(play.id).toBe(`yasrebi-${source.id}`)
      expect(play.title).toBe(source.title)
      expect(play.author).toBe(yasrebiAuthor)
      expect(play.characters.map((character) => character.name)).toEqual(source.characters)
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
        expect(play.characters.find((character) => character.id === dialogue.characterId)?.name).toBe(record[1])
        expect(dialogue.parts).toEqual([{ type: 'speech', text: record[2] }])
        expect(dialogueText(dialogue)).toBe(record[2])
      })
    })
  })

  it('keeps the original bundled play and exposes all three Yasrebi plays', () => {
    expect(bundledPlays[0].id).toBe(bundledPlay.id)
    expect(bundledPlays.slice(1, 4).map((play) => play.id)).toEqual(yasrebiBundledPlays.map((play) => play.id))
  })

  it('preserves customized colors by stable id or matching character name', () => {
    const source = yasrebiBundledPlays[0]
    const existing: Play = {
      ...source,
      characters: source.characters.map((character, index) => index === 0
        ? { ...character, id: 'legacy-role-id', color: '#123456' }
        : character)
    }

    expect(mergeBundledPlay(source, existing).characters[0].color).toBe('#123456')

    const existingHorse: Play = {
      ...bundledPlay,
      characters: bundledPlay.characters.map((character) => character.id === 'woman'
        ? { ...character, id: 'wife', color: '#654321' }
        : character)
    }
    expect(mergeBundledPlay(bundledPlay, existingHorse).characters.find((character) => character.id === 'woman')?.color).toBe('#654321')
  })
})
