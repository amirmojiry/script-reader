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

  it('keeps source metadata, discovery metadata, and truncation sentinels', () => {
    expect(betrayalPlay).toMatchObject({
      id: BETRAYAL_BUNDLED_ID,
      title: 'خیانت',
      author: 'هارولد پینتر',
      translator: 'نگار جواهریان / تینوش نظم‌جو',
      genres: ['درام', 'روان‌شناختی']
    })
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
