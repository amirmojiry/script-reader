import { describe, expect, it } from 'vitest'
import { bundledPlays } from '../src/data/bundledPlays'
import { BETRAYAL_BUNDLED_ID, betrayalPlay, betrayalSource } from '../src/data/pinter'
import type { DialogueBlock } from '../src/types'
import { dialogueText, flattenBlocks, validatePlay } from '../src/utils/play'

const expectedSceneCounts = [222, 152, 111, 112, 145, 117, 156, 124, 55]

describe('Harold Pinter Betrayal bundled play', () => {
  it('preserves all nine supplied scenes and source records in canonical order', () => {
    expect(betrayalSource.scenes).toHaveLength(9)
    expect(betrayalPlay.acts).toHaveLength(1)
    expect(betrayalPlay.acts[0].scenes).toHaveLength(9)
    expect(validatePlay(betrayalPlay)).toEqual({ valid: true, errors: [] })

    betrayalSource.scenes.forEach((sourceScene, sceneIndex) => {
      const scene = betrayalPlay.acts[0].scenes[sceneIndex]
      expect(sourceScene.records).toHaveLength(expectedSceneCounts[sceneIndex])
      expect(scene.title).toBe(sourceScene.title)
      expect(scene.blocks).toHaveLength(sourceScene.records.length)

      sourceScene.records.forEach((record, recordIndex) => {
        const block = scene.blocks[recordIndex]
        expect(block.id).toBe(`s${sceneIndex + 1}-b${String(recordIndex + 1).padStart(4, '0')}`)

        if (record[0] === 's') {
          expect(block).toEqual({ id: block.id, type: 'stage-direction', text: record[1] })
          return
        }

        expect(block.type).toBe('dialogue')
        const dialogue = block as DialogueBlock
        expect(betrayalPlay.characters.find((character) => character.id === dialogue.characterId)?.name).toBe(record[1])
        expect(dialogue.parts).toEqual([{ type: 'speech', text: record[2] }])
        expect(dialogueText(dialogue)).toBe(record[2])
      })
    })
  })

  it('keeps the reviewed scene-two disclosure exchange on the correct speakers', () => {
    const records = betrayalSource.scenes[1].records

    expect(records).toContainEqual(['d', 'رابرت', 'خیلی مهم نیست، هست؟ سال‌هاست که تموم شده، نیست؟'])
    expect(records).toContainEqual(['d', 'جری', 'من می‌دونم دیشب بین شما چه اتفاقی افتاد. همه‌چی رو برام گفت. شما تمام شب بیدار موندین، مگه نه؟'])
    expect(records).toContainEqual(['d', 'رابرت', 'بنابراین لازم نبود دیشب دوباره بهم بگه. چون من می‌دونستم، و اون می‌دونست من می‌دونم چون خودش چهار سال پیش بهم گفته بود.'])
  })

  it('keeps the additional reviewed speaker corrections on the right roles', () => {
    const sceneOneRecords = betrayalSource.scenes[0].records
    const sceneFiveRecords = betrayalSource.scenes[4].records

    expect(sceneOneRecords).toContainEqual(['d', 'جری', 'نِد پنج‌سالشه، درسته؟'])
    expect(sceneFiveRecords).toContainEqual(['d', 'اما', 'اون‌قدرها هم خوب نیست.'])
    expect(sceneFiveRecords).toContainEqual(['d', 'رابرت', 'من همیشه جری رو خیلی دوست داشتم. راستش، خیلی بیشتر از تو. شاید بهتر بود من یه رابطه باهاش داشتم.'])
  })

  it('keeps the latest reviewed scene-three speakers and scene-seven waiter order', () => {
    const sceneThreeRecords = betrayalSource.scenes[2].records
    const sceneSevenRecords = betrayalSource.scenes[6].records

    expect(sceneThreeRecords).toContainEqual([
      'd',
      'اما',
      'قبلاً... ما کلی خلاقیت به خرج می‌دادیم... انرژی می‌گذاشتیم... سخت بود... همدیگه رو دیدن غیرممکن به نظر می‌اومد... غیرممکن... ولی باز همدیگه رو می‌دیدیم. می‌اومدیم این‌جا و همدیگه رو می‌دیدیم. ما این سوئیت رو اجاره کردیم، و این‌جا همدیگه رو می‌دیدیم، چون دلمون واقعاً می‌خواست.'
    ])
    expect(sceneThreeRecords).toContainEqual(['d', 'اما', 'بله، می‌رفتیم.'])

    const waiterReplyIndex = sceneSevenRecords.findIndex(
      (record) => record[0] === 'd' && record[1] === 'پیشخدمت' && record[2] === 'همین الان، سینیوره!'
    )
    expect(waiterReplyIndex).toBeGreaterThanOrEqual(0)
    expect(sceneSevenRecords[waiterReplyIndex + 1]).toEqual(['s', 'پیشخدمت خارج می‌شود.'])
  })

  it('keeps source metadata, discovery metadata, and truncation sentinels', () => {
    expect(betrayalPlay).toMatchObject({
      id: BETRAYAL_BUNDLED_ID,
      title: 'خیانت',
      author: 'هارولد پینتر',
      translators: ['نگار جواهریان', 'تینوش نظم‌جو'],
      genres: ['درام', 'روان‌شناختی']
    })
    expect(betrayalPlay.translator).toBeUndefined()
    expect(betrayalPlay.characters.map((character) => [character.name, character.gender])).toEqual([
      ['اما', 'female'],
      ['جری', 'male'],
      ['رابرت', 'male'],
      ['پیشخدمت', 'male']
    ])

    const blocks = flattenBlocks(betrayalPlay)
    expect(blocks).toHaveLength(expectedSceneCounts.reduce((sum, count) => sum + count, 0))
    expect(betrayalPlay.acts[0].scenes[0].blocks[0]).toEqual({
      id: 's1-b0001',
      type: 'stage-direction',
      text: 'ظهر.'
    })
    expect(betrayalPlay.acts[0].scenes[8].blocks.at(-2)).toEqual({
      id: `s9-b${String(expectedSceneCounts[8] - 1).padStart(4, '0')}`,
      type: 'stage-direction',
      text: 'تاریکی'
    })
    expect(betrayalPlay.acts[0].scenes[8].blocks.at(-1)).toEqual({
      id: `s9-b${String(expectedSceneCounts[8]).padStart(4, '0')}`,
      type: 'stage-direction',
      text: 'پایان'
    })
  })

  it('is exposed once in the bundled catalog with a reserved unique id', () => {
    expect(BETRAYAL_BUNDLED_ID).toBe('builtin:pinter:betrayal')
    expect(bundledPlays).toHaveLength(9)
    expect(bundledPlays.filter((play) => play.id === BETRAYAL_BUNDLED_ID)).toHaveLength(1)
    expect(new Set(bundledPlays.map((play) => play.id)).size).toBe(bundledPlays.length)
  })
})
