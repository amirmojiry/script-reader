import { describe, expect, it } from 'vitest'
import type { Play, ProofreadingCorrection } from '../src/types'
import {
  applyProofreadingCorrections,
  buildProofreadingExport,
  correctionClipboardText,
  proofreadingDisplaySegments,
  serializeProofreadingExport
} from '../src/utils/proofreading'

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
  it('applies chained local corrections and marks the changed range for display', () => {
    const first = correction({
      originalText: 'سلام کسی این جا نیست؟',
      correctedText: 'سلام. کسی این جا نیست؟',
      createdAt: '2026-09-20T10:00:00.000Z'
    })
    const second = correction({
      id: 'c-2',
      originalText: 'نیست؟',
      correctedText: 'نیست؟!',
      createdAt: '2026-09-20T10:01:00.000Z'
    })

    const source = 'سلام کسی این جا نیست؟'
    expect(applyProofreadingCorrections(source, [second, first])).toBe('سلام. کسی این جا نیست؟!')

    const segments = proofreadingDisplaySegments(source, [first])
    expect(segments.map((segment) => segment.text).join('')).toBe('سلام. کسی این جا نیست؟')
    expect(segments.some((segment) => segment.changed && segment.text.includes('.'))).toBe(true)
  })


  it('applies a correction to the selected repeated occurrence and supports deletion', () => {
    const source = 'بله بله بله'
    const replaceSecond = correction({
      originalText: 'بله',
      originalOffset: 4,
      correctedText: 'خیر'
    })
    expect(applyProofreadingCorrections(source, [replaceSecond])).toBe('بله خیر بله')

    const deleteSecond = correction({
      id: 'c-delete',
      originalText: 'بله',
      originalOffset: 4,
      correctedText: ''
    })
    expect(applyProofreadingCorrections(source, [deleteSecond])).toBe('بله  بله')
  })

  it('applies fresh lengthening corrections even when the replacement matches following source text', () => {
    const lengthen = correction({
      originalText: 'a',
      originalOffset: 0,
      sourceBlockText: 'abc',
      correctedText: 'ab'
    })

    expect(applyProofreadingCorrections('abc', [lengthen])).toBe('abbc')
  })

  it('skips a prefix-lengthening correction already baked into newer source', () => {
    const lengthen = correction({
      originalText: 'a',
      originalOffset: 0,
      sourceBlockText: 'abc',
      correctedText: 'ab'
    })

    expect(applyProofreadingCorrections('abbc', [lengthen])).toBe('abbc')
  })

  it('keeps a lengthening correction after unrelated source text changes', () => {
    const lengthen = correction({
      originalText: 'a',
      originalOffset: 0,
      sourceBlockText: 'abc old',
      correctedText: 'ab'
    })

    expect(applyProofreadingCorrections('abc new', [lengthen])).toBe('abbc new')
  })

  it('applies shortening replacements when the full original still matches at the stored offset', () => {
    const shorten = correction({
      originalText: 'سلامم',
      originalOffset: 0,
      correctedText: 'سلام'
    })

    expect(applyProofreadingCorrections('سلامم دنیا', [shorten])).toBe('سلام دنیا')
  })

  it('does not replay a local correction that is already present in updated source', () => {
    const bakedWithOffset = correction({
      originalText: 'سلام',
      originalOffset: 0,
      correctedText: 'سلام.'
    })
    expect(applyProofreadingCorrections('سلام. کسی این جا نیست؟', [bakedWithOffset]))
      .toBe('سلام. کسی این جا نیست؟')

    const legacyWithoutOffset = correction({
      id: 'legacy',
      originalText: 'سلام',
      correctedText: 'سلام.'
    })
    expect(applyProofreadingCorrections('سلام. کسی این جا نیست؟', [legacyWithoutOffset]))
      .toBe('سلام. کسی این جا نیست؟')
  })

  it('skips baked reductions even when identical text remains at the recorded offset', () => {
    const adjacentDeletion = correction({
      originalText: 'bad',
      originalOffset: 0,
      sourceBlockText: 'badbad',
      correctedText: ''
    })
    expect(applyProofreadingCorrections('bad', [adjacentDeletion])).toBe('bad')

    const shortening = correction({
      id: 'shorten-baked',
      originalText: 'aaa',
      originalOffset: 0,
      sourceBlockText: 'aaa',
      correctedText: 'aa'
    })
    expect(applyProofreadingCorrections('aa', [shortening])).toBe('aa')

    expect(applyProofreadingCorrections('badbad', [adjacentDeletion])).toBe('bad')
    expect(applyProofreadingCorrections('aaa', [shortening])).toBe('aa')
  })

  it('does not relocate a baked-in deletion to another occurrence after source changes', () => {
    const deletion = correction({
      originalText: 'bad',
      originalOffset: 0,
      sourceBlockText: 'bad good bad',
      correctedText: ''
    })

    expect(applyProofreadingCorrections(' good bad', [deletion])).toBe(' good bad')
  })

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
