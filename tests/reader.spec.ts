import { describe, expect, it } from 'vitest'
import { demoPlay } from '../src/data/demo'
import { flattenBlocks } from '../src/utils/play'
import { automaticReadingText, isCharacterSpeechBlock, rehearsalCueIndexes, rehearsalCueIndexesForOwnIndexes, searchBlockIndexes, visibleBlockIndexes, visibleOwnedIndexes } from '../src/utils/reader'

describe('reader filtering utilities', () => {
  const blocks = flattenBlocks(demoPlay)

  it('keeps the active search target visible in rehearsal cue-only mode', () => {
    const otherIndex = blocks.findIndex((block) => block.type === 'dialogue' && block.characterId !== 'mother')
    expect(otherIndex).toBeGreaterThanOrEqual(0)
    const indexes = rehearsalCueIndexes(blocks, 'mother', otherIndex, [otherIndex])
    expect(indexes).toContain(otherIndex)
  })

  it('excludes hidden stage directions from search results', () => {
    const stage = blocks.find((block) => block.type === 'stage-direction')
    expect(stage?.type).toBe('stage-direction')
    if (!stage || stage.type !== 'stage-direction') throw new Error('fixture has no stage direction')
    const query = stage.text.split(/\s+/u)[0]
    const visibleResults = searchBlockIndexes(blocks, query, false)
    const hiddenResults = searchBlockIndexes(blocks, query, true)
    const stageIndex = blocks.indexOf(stage)
    expect(visibleResults).toContain(stageIndex)
    expect(hiddenResults).not.toContain(stageIndex)
  })

  it('excludes narrator-only dialogue from actor cue and speech ownership', () => {
    const narratorOnly = { id: 'narrator-only', type: 'dialogue' as const, characterId: 'mother', parts: [{ type: 'speech' as const, text: '(مکث)' }] }
    const actual = { id: 'actual', type: 'dialogue' as const, characterId: 'mother', parts: [{ type: 'speech' as const, text: 'حالا برو.' }] }
    const customBlocks = [narratorOnly, actual]

    expect(isCharacterSpeechBlock(narratorOnly, 'mother')).toBe(false)
    expect(isCharacterSpeechBlock(actual, 'mother')).toBe(true)
    expect(isCharacterSpeechBlock(actual, undefined)).toBe(false)

    const cueIndexes = rehearsalCueIndexes(customBlocks, 'mother', 0)
    expect(cueIndexes).toContain(1)
    // The narrator-only block may remain as preceding cue context, but it is not actor-owned.
    expect(cueIndexes).toEqual([0, 1])
  })

  it('treats joint dialogue as owned by every participating character', () => {
    const joint = {
      id: 'joint',
      type: 'dialogue' as const,
      characterId: 'mother',
      characterIds: ['mother', 'messenger'],
      parts: [{ type: 'speech' as const, text: 'با هم.' }]
    }

    expect(isCharacterSpeechBlock(joint, 'mother')).toBe(true)
    expect(isCharacterSpeechBlock(joint, 'messenger')).toBe(true)
    expect(isCharacterSpeechBlock(joint, 'other')).toBe(false)
  })

  it('supports narrator rehearsal using precomputed narrator-owned indexes', () => {
    const stageIndex = blocks.findIndex((block) => block.type === 'stage-direction')
    expect(stageIndex).toBeGreaterThanOrEqual(0)
    const indexes = rehearsalCueIndexesForOwnIndexes(blocks, [stageIndex], stageIndex)
    expect(indexes).toContain(stageIndex)
  })

  it('filters hidden stage directions out of narrator-owned navigation', () => {
    const stageIndex = blocks.findIndex((block) => block.type === 'stage-direction')
    const dialogueIndex = blocks.findIndex((block) => block.type === 'dialogue')
    expect(stageIndex).toBeGreaterThanOrEqual(0)
    expect(dialogueIndex).toBeGreaterThanOrEqual(0)

    const indexes = visibleOwnedIndexes(blocks, [stageIndex, dialogueIndex], true)
    expect(indexes).not.toContain(stageIndex)
    expect(indexes).toContain(dialogueIndex)
  })

  it('keeps narrator-owned content in automatic reading text', () => {
    const dialogue = {
      id: 'mixed',
      type: 'dialogue' as const,
      characterId: 'mother',
      parts: [{ type: 'speech' as const, text: '(در را می‌بندد) بگو ببینم. (می‌نشیند).' }]
    }
    const stage = { id: 'stage', type: 'stage-direction' as const, text: '(در زده می‌شود.)' }
    const section = { id: 'section', type: 'section' as const, title: 'پرده اول' }

    expect(automaticReadingText(dialogue)).toBe('(در را می‌بندد) بگو ببینم. (می‌نشیند).')
    expect(automaticReadingText(stage)).toBe('(در زده می‌شود.)')
    expect(automaticReadingText(section)).toBe('')
  })

  it('removes stage directions from table-read navigation when hidden', () => {
    const indexes = visibleBlockIndexes(blocks, true)
    expect(indexes.every((index) => blocks[index]?.type !== 'stage-direction')).toBe(true)
  })
})
