import { describe, expect, it } from 'vitest'
import type { Play, ProofreadingCorrection } from '../src/types'
import { buildProofreadingExport, correctionClipboardText, serializeProofreadingExport } from '../src/utils/proofreading'

const play: Play = {
  id: 'play-1',
  title: 'نمایش تست',
  author: 'نویسنده',
  translator: 'مترجم',
  characters: [],
  acts: []
}

function correction(overrides: Partial<ProofreadingCorrection>): ProofreadingCorrection {
  return {
    id: 'c-1',
    playId: play.id,
    playTitle: play.title,
    blockId: 'block-1',
    blockIndex: 1,
    blockType: 'dialogue',
    dialogueNumber: 1,
    originalText: 'غلط',
    correctedText: 'درست',
    createdAt: '2026-09-20T10:00:00.000Z',
    ...overrides
  }
}

describe('proofreading export', () => {
  it('formats a single correction for clipboard handoff', () => {
    expect(correctionClipboardText(correction({}))).toBe(
      'نمایشنامه: نمایش تست\nدیالوگ شماره 1\nمتن اشتباه: غلط\nمتن درست: درست'
    )
  })

  it('exports deterministic ordered JSON with play metadata and correction identifiers', () => {
    const later = correction({ id: 'c-2', blockId: 'block-2', blockIndex: 3, dialogueNumber: 2, createdAt: '2026-09-20T11:00:00.000Z' })
    const earlier = correction({ id: 'c-1', blockIndex: 1 })

    const exported = buildProofreadingExport(play, [later, earlier])
    expect(exported.format).toBe('script-reader-proofreading')
    expect(exported.play).toEqual({
      id: 'play-1',
      title: 'نمایش تست',
      author: 'نویسنده',
      translator: 'مترجم'
    })
    expect(exported.corrections.map((item) => item.blockId)).toEqual(['block-1', 'block-2'])
    expect(JSON.parse(serializeProofreadingExport(play, [later, earlier]))).toEqual(exported)
  })
})
