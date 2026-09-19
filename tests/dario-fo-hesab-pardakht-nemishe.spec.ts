import { describe, expect, it } from 'vitest'
import { bundledPlays } from '../src/data/bundledPlays'
import {
  HESAB_PARDAKHT_NEMISHE_BUNDLED_ID,
  hesabPardakhtNemishePlay,
  hesabPardakhtNemisheSource
} from '../src/data/darioFo'
import type { DialogueBlock } from '../src/types'
import { dialogueCharacterIds, dialogueText, flattenBlocks, validatePlay } from '../src/utils/play'

describe('حساب پرداخت نمی‌شه! bundled play', () => {
  it('preserves the supplied two-act source in canonical order', () => {
    const blocks = flattenBlocks(hesabPardakhtNemishePlay)

    expect(hesabPardakhtNemisheSource.acts.map((act) => act.records.length)).toEqual([479, 535])
    expect(hesabPardakhtNemishePlay.acts).toHaveLength(2)
    expect(hesabPardakhtNemishePlay.characters).toHaveLength(9)
    expect(blocks).toHaveLength(1014)
    expect(blocks.filter((block) => block.type === 'dialogue')).toHaveLength(989)
    expect(blocks.filter((block) => block.type === 'stage-direction')).toHaveLength(25)
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
          const expectedNames = Array.isArray(record[1]) ? record[1] : [record[1]]
          const actualNames = dialogueCharacterIds(dialogue).map((id) =>
            hesabPardakhtNemishePlay.characters.find((character) => character.id === id)?.name
          )
          expect(actualNames).toEqual(expectedNames)
          expect(dialogue.parts).toEqual([{ type: 'speech', text: record[2] }])
          expect(dialogueText(dialogue)).toBe(record[2])
        }

        absoluteIndex += 1
      })
    })

    expect(blocks[478]?.id).toBe('a1-b0479')
    expect(blocks[479]?.id).toBe('a2-b0001')
    expect(blocks.at(-1)).toEqual({
      id: 'a2-b0535',
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
    expect(dialogueTexts).toContain('تنفس مصنوعی.')
    expect(dialogueTexts).toContain('ننه‌جان دستم به دامنت!')
    const jointBlock = blocks.find((block) => block.type === 'dialogue' && dialogueText(block).startsWith('ننه‌جان دستم به دامنت!'))
    expect(jointBlock?.type).toBe('dialogue')
    if (jointBlock?.type === 'dialogue') {
      expect(dialogueCharacterIds(jointBlock)).toEqual(['giovanni', 'luigi'])
    }
    expect(dialogueTexts).toContain('اویلالیای مقدس با شکم برآمده')
    expect(dialogueTexts).toContain('قاتل‌ها! خوک‌ها! لعنتی‌ها!')
    expect(dialogueTexts).toContain('شما رفتار اعتماد‌برانگیزی دارید. همین‌جا زندگی می‌کنید؟')
    expect(dialogueTexts).not.toContain('قطار را متوقف کردند.\nهذیان نگو')
    expect(dialogueTexts + stageTexts).not.toMatch(/(^|[^\u0600-\u06FF])اچرا([^\u0600-\u06FF]|$)/)
    expect(dialogueTexts).toContain('زن تو کاملا سالم است و کماکان می‌تواند بچه‌دار بشود')
    expect(dialogueTexts).toContain('امروز هم واقعاً مثل روز مادر است')
    expect(stageTexts).not.toContain('خانه‌ی پسر خانم رزا را تفتیش کردند')
    expect(dialogueTexts + stageTexts).not.toContain('کِصِ77 ۱۸۵۱')
    expect(dialogueTexts + stageTexts).not.toContain('۲ لمع 1')
    expect(dialogueTexts + stageTexts).not.toMatch(/(^|\n)ساب پرداخت نمی‌شه($|\n)/)
    expect(dialogueTexts + stageTexts).not.toContain('۹ص مع «ا')
    expect(dialogueTexts + stageTexts).not.toContain('کفت‌وکو')
    expect(dialogueTexts + stageTexts).not.toContain('ایسن')
    expect(dialogueTexts + stageTexts).not.toContain('جسووانی')
    expect(dialogueTexts + stageTexts).not.toContain('دار یو فو')
    expect(dialogueTexts + stageTexts).not.toContain('داربو فو')
    expect(dialogueTexts + stageTexts).not.toContain('سیصٍث')
    expect(dialogueTexts + stageTexts).not.toContain('|')
    expect(dialogueTexts + stageTexts).not.toContain('آن‌وقت آنوقت')
    expect(dialogueTexts + stageTexts).not.toMatch(/تولید کرده نا|نمی‌دهسیم|ولبی|یبک‌دیگر|(?:^|\s)وب گوش کن/)
    expect(dialogueTexts + stageTexts).not.toMatch(/آ»|بُزییاری|کش‌رفتماه|نو می‌خواستی|ریل راء‌آهن|طلب‌هاا/)
    expect(dialogueTexts + stageTexts).not.toMatch(/بودندا|کردندا|باشیدا|نکنندا|نشده بودا|تلقین بودا/)
    expect(dialogueTexts + stageTexts).not.toMatch(/بتو!نید|نور!نی|می‌تو!نستم/)
    expect(dialogueTexts + stageTexts).not.toMatch(/می‌شودا|اگسر|نمی‌فهمندا|فکر می‌کنناد|می‌کردیدا|می‌روندا|نمی‌کشدا|می‌اندازدا|می‌رسیدا|ماچرا/)
    expect(dialogueTexts + stageTexts).not.toMatch(/(?:^|\s)۱(?:\s|$|[؟?!.,،])/)
    expect(dialogueTexts + stageTexts).not.toMatch(/بببیرون|ببیرون|اشتباههه|واقعاًً|اینن|یبن|بیاء|مار گریتا|سپیل|مقاببل|می‌کن،د|می‌تو!نیم|بتو!نم/)
    expect(dialogueTexts + stageTexts).not.toMatch(/صدا البته|مردانه باشدا|دستو رات|تقتیش/)
    expect(dialogueTexts + stageTexts).not.toMatch(/مسسه|حدافل|منامن|فانون|مواطب/)
    expect(dialogueTexts + stageTexts).not.toMatch(/راهتان را بشید|می‌ایم|یاباید|یااداره|کلاه‌بر دارها|شلوغ کننا|شوخی کردا|رفت\.\. ,/)
    expect((dialogueTexts + stageTexts).split('مارگریتا مایحتاج گوناگون را زیر پیراهنش جا می‌دهد').length - 1).toBe(1)
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
