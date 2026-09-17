import { describe, expect, it } from 'vitest'
import { demoPlay } from '../src/data/demo'
import { analyzePlay, dialogueText, flattenBlocks, validatePlay, wordCount } from '../src/utils/play'

describe('play utilities', () => {
  it('flattens scenes into a stable reading sequence', () => {
    const blocks = flattenBlocks(demoPlay)
    expect(blocks.length).toBeGreaterThan(20)
    expect(blocks[0]?.type).toBe('stage-direction')
  })

  it('counts only spoken text and not inline directions', () => {
    const block = flattenBlocks(demoPlay).find((candidate) => candidate.type === 'dialogue' && candidate.parts.some((part) => part.type === 'direction'))
    expect(block?.type).toBe('dialogue')
    if (block?.type !== 'dialogue') throw new Error('Expected dialogue block')
    expect(dialogueText(block)).not.toContain('صدای طبل')
    expect(wordCount(dialogueText(block))).toBeGreaterThan(0)
  })

  it('calculates spoken-word share and estimated duration', () => {
    const stats = analyzePlay(demoPlay)
    const totalShare = Object.values(stats).reduce((sum, item) => sum + item.shareOfWords, 0)
    expect(totalShare).toBeCloseTo(100, 5)
    expect(stats.mother.dialogueCount).toBeGreaterThan(0)
    expect(stats.messenger.blockIndexes.length).toBe(stats.messenger.dialogueCount)
    expect(stats.mother.estimatedMinutes).toBeGreaterThan(0)
  })

  it('validates the complete nested play contract', () => {
    expect(validatePlay(demoPlay)).toEqual({ valid: true, errors: [] })
    expect(validatePlay({ title: 'x' }).valid).toBe(false)
  })

  it('rejects duplicate block ids and unknown characters', () => {
    const malformed = structuredClone(demoPlay)
    const firstScene = malformed.acts[0].scenes[0]
    const firstDialogue = firstScene.blocks.find((block) => block.type === 'dialogue')
    if (!firstDialogue || firstDialogue.type !== 'dialogue') throw new Error('fixture has no dialogue')
    firstDialogue.characterId = 'missing-character'
    firstScene.blocks.push({ ...firstDialogue })
    const result = validatePlay(malformed)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('شخصیت ناشناخته')
    expect(result.errors.join(' ')).toContain('تکراری')
  })
})
