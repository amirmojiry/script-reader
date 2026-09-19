import { describe, expect, it } from 'vitest'
import { bundledPlays } from '../src/data/bundledPlays'
import {
  UNEXPECTED_GUEST_BUNDLED_ID,
  unexpectedGuestPlay,
  unexpectedGuestSource
} from '../src/data/unexpectedGuest'
import type { DialogueBlock } from '../src/types'
import { dialogueText, flattenBlocks, validatePlay } from '../src/utils/play'

describe('Unexpected Guest bundled play', () => {
  it('preserves the supplied metadata and all source records in canonical order', () => {
    const blocks = flattenBlocks(unexpectedGuestPlay)

    expect(unexpectedGuestSource.records).toHaveLength(149)
    expect(unexpectedGuestPlay).toMatchObject({
      id: UNEXPECTED_GUEST_BUNDLED_ID,
      title: 'مهمان ناخوانده',
      author: 'اریک امانوئل اشمیت',
      translator: 'تینوش نظم‌جو'
    })
    expect(unexpectedGuestPlay.characters.map((character) => character.name)).toEqual([
      'فروید',
      'آنا',
      'مأمور نازی',
      'ناشناس'
    ])
    expect(validatePlay(unexpectedGuestPlay)).toEqual({ valid: true, errors: [] })
    expect(blocks).toHaveLength(unexpectedGuestSource.records.length)

    unexpectedGuestSource.records.forEach((record, index) => {
      const block = blocks[index]
      expect(block.id).toBe(`block-${String(index + 1).padStart(4, '0')}`)

      if (record[0] === 's') {
        expect(block).toEqual({ id: block.id, type: 'stage-direction', text: record[1] })
        return
      }

      expect(block.type).toBe('dialogue')
      const dialogue = block as DialogueBlock
      expect(unexpectedGuestPlay.characters.find((character) => character.id === dialogue.characterId)?.name).toBe(record[1])
      expect(dialogue.parts).toEqual([{ type: 'speech', text: record[2] }])
      expect(dialogueText(dialogue)).toBe(record[2])
    })
  })

  it('is exposed as a bundled play with a reserved unique id', () => {
    expect(bundledPlays).toHaveLength(6)
    expect(unexpectedGuestPlay.id).toBe('builtin:schmitt:unexpected-guest')
    expect(bundledPlays.at(-1)?.id).toBe(unexpectedGuestPlay.id)
    expect(new Set(bundledPlays.map((play) => play.id)).size).toBe(bundledPlays.length)
  })
})
