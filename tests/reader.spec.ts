import { describe, expect, it } from 'vitest'
import { demoPlay } from '../src/data/demo'
import { flattenBlocks } from '../src/utils/play'
import { rehearsalCueIndexes, searchBlockIndexes, visibleBlockIndexes } from '../src/utils/reader'

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

  it('removes stage directions from table-read navigation when hidden', () => {
    const indexes = visibleBlockIndexes(blocks, true)
    expect(indexes.every((index) => blocks[index]?.type !== 'stage-direction')).toBe(true)
  })
})
