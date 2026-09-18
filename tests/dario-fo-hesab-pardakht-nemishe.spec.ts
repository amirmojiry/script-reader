import { describe, expect, it } from 'vitest'
import { bundledPlays } from '../src/data/bundledPlays'
import {
  HESAB_PARDAKHT_NEMISHE_BUNDLED_ID,
  hesabPardakhtNemishePlay,
  hesabPardakhtNemisheSource
} from '../src/data/darioFo'
import type { DialogueBlock } from '../src/types'
import { dialogueText, flattenBlocks, validatePlay } from '../src/utils/play'

describe('حساب پرداخت نمی‌شه! bundled play', () => {
  it('preserves the supplied two-act source in canonical order', () => {
    const blocks = flattenBlocks(hesabPardakhtNemishePlay)

    expect(hesabPardakhtNemisheSource.acts.map((act) => act.records.length)).toEqual([470, 519])
    expect(hesabPardakhtNemishePlay.acts).toHaveLength(2)
    expect(blocks).toHaveLength(989)
    expect(blocks.filter((block) => block.type === 'dialogue')).toHaveLength(962)
    expect(blocks.filter((block) => block.type === 'stage-direction')).toHaveLength(27)
    expect(hesabPardakhtNemishePlay.characters.map((character) => character.name)).toEqual([
      'آنتونیا',
      'جووانی',
      'مارگریتا',
      'لوئیجی',
      'پاسبان',
      'ژاندارم',
      'پیرمرد',
      'گورکن',
      'ماموران پلیس'
    ])
    expect(validatePlay(hesabPardakhtNemishePlay)).toEqual({ valid: true, errors: [] })

    let absoluteIndex = 0
    hesabPardakhtNemisheSource.acts.forEach((act, actIndex) => {
      const canonicalBlocks = hesabPardakhtNemishePlay.acts[actIndex].scenes[0].blocks
      expect(canonicalBlocks).toHaveLength(act.records.length)

      act.records.forEach((record, recordIndex) => {
        const block = canonicalBlocks[recordIndex]
        expect(block.id).toBe(`a${actIndex + 1}-b${String(recordIndex + 1).padStart(4, '0')}`)
        expect(blocks[absoluteIndex]).toEqual(block)

        if (record[0] === 's') {
          expect(block).toEqual({ id: block.id, type: 'stage-direction', text: record[1] })
        } else {
          expect(block.type).toBe('dialogue')
          const dialogue = block as DialogueBlock
          expect(hesabPardakhtNemishePlay.characters.find((character) => character.id === dialogue.characterId)?.name).toBe(record[1])
          expect(dialogue.parts).toEqual([{ type: 'speech', text: record[2] }])
          expect(dialogueText(dialogue)).toBe(record[2])
        }

        absoluteIndex += 1
      })
    })

    expect(blocks[469]?.id).toBe('a1-b0470')
    expect(blocks[470]?.id).toBe('a2-b0001')
    expect(blocks.at(-1)).toEqual({
      id: 'a2-b0519',
      type: 'stage-direction',
      text: '(با بیان آخرین جمله صحنه کم‌کم تاریک می‌شود.)'
    })
  })

  it('keeps page-break speech with its speaker and excludes scan artifacts', () => {
    const blocks = flattenBlocks(hesabPardakhtNemishePlay)
    const dialogueTexts = blocks
      .filter((block): block is DialogueBlock => block.type === 'dialogue')
      .map((block) => dialogueText(block))
      .join('\n')
    const stageTexts = blocks
      .filter((block) => block.type === 'stage-direction')
      .map((block) => block.text)
      .join('\n')

    expect(dialogueTexts).toContain('خانه‌ی پسر خانم رزا را تفتیش کردند')
    expect(dialogueTexts).toContain('اطلاعات بیش‌تری در مورد این دو راننده کامیون ندارید؟')
    expect(dialogueTexts).toContain('همیشه مرده‌ها را توی کمد جای می‌دهند')
    expect(dialogueTexts).toContain('همبستگی چه می‌شد؟')
    expect(dialogueTexts).toContain('خواب دیدی! قبول کن!')
    expect(stageTexts).not.toContain('خانه‌ی پسر خانم رزا را تفتیش کردند')
    expect(dialogueTexts + stageTexts).not.toContain('کِصِ77 ۱۸۵۱')
    expect(dialogueTexts + stageTexts).not.toContain('۲ لمع 1')
    expect(dialogueTexts + stageTexts).not.toContain('ساب پرداخت نمی‌شه')
    expect(dialogueTexts + stageTexts).not.toContain('۹ص مع «ا')
    expect(dialogueTexts + stageTexts).not.toContain('دار یو فو')
    expect(dialogueTexts + stageTexts).not.toContain('داربو فو')
    expect(dialogueTexts + stageTexts).not.toContain('سیصٍث')
  })

  it('is exposed with reserved id and complete discovery metadata', () => {
    expect(hesabPardakhtNemishePlay).toMatchObject({
      id: HESAB_PARDAKHT_NEMISHE_BUNDLED_ID,
      title: 'حساب پرداخت نمی‌شه!',
      author: 'داریو فو',
      translator: 'حامد جهانشاهی',
      genres: ['کمدی']
    })
    expect(hesabPardakhtNemishePlay.characters.every((character) =>
      ['male', 'female', 'unknown'].includes(character.gender ?? '')
    )).toBe(true)
    expect(bundledPlays.map((play) => play.id)).toContain(HESAB_PARDAKHT_NEMISHE_BUNDLED_ID)
    expect(new Set(bundledPlays.map((play) => play.id)).size).toBe(bundledPlays.length)
  })
})
