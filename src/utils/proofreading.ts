import type { Play, ProofreadingCorrection } from '../types'

export interface ProofreadingExport {
  format: 'script-reader-proofreading'
  version: 1
  play: {
    id: string
    title: string
    author?: string
    translator?: string
  }
  corrections: Array<{
    blockId: string
    blockIndex: number
    blockType: ProofreadingCorrection['blockType']
    dialogueNumber?: number
    originalText: string
    correctedText: string
    createdAt: string
  }>
}

export function correctionClipboardText(correction: ProofreadingCorrection): string {
  const location = correction.dialogueNumber
    ? `دیالوگ شماره ${correction.dialogueNumber}`
    : `بخش شماره ${correction.blockIndex}`
  return [
    `نمایشنامه: ${correction.playTitle}`,
    location,
    `متن اشتباه: ${correction.originalText}`,
    `متن درست: ${correction.correctedText}`
  ].join('\n')
}

export function buildProofreadingExport(play: Play, corrections: ProofreadingCorrection[]): ProofreadingExport {
  const ordered = [...corrections].sort((a, b) =>
    a.blockIndex - b.blockIndex || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  )

  return {
    format: 'script-reader-proofreading',
    version: 1,
    play: {
      id: play.id,
      title: play.title,
      ...(play.author ? { author: play.author } : {}),
      ...(play.translator ? { translator: play.translator } : {})
    },
    corrections: ordered.map((correction) => ({
      blockId: correction.blockId,
      blockIndex: correction.blockIndex,
      blockType: correction.blockType,
      ...(correction.dialogueNumber ? { dialogueNumber: correction.dialogueNumber } : {}),
      originalText: correction.originalText,
      correctedText: correction.correctedText,
      createdAt: correction.createdAt
    }))
  }
}

export function serializeProofreadingExport(play: Play, corrections: ProofreadingCorrection[]): string {
  return JSON.stringify(buildProofreadingExport(play, corrections), null, 2)
}


export interface ProofreadingDisplaySegment {
  text: string
  changed: boolean
}

function sortCorrections(corrections: ProofreadingCorrection[]): ProofreadingCorrection[] {
  return [...corrections].sort((a, b) =>
    a.blockIndex - b.blockIndex || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  )
}

export function proofreadingCorrectionsForBlock(
  corrections: ProofreadingCorrection[],
  blockId: string
): ProofreadingCorrection[] {
  return sortCorrections(corrections.filter((correction) => correction.blockId === blockId))
}

export function applyProofreadingCorrections(
  sourceText: string,
  corrections: ProofreadingCorrection[]
): string {
  let text = sourceText
  for (const correction of sortCorrections(corrections)) {
    if (!correction.originalText || correction.originalText === correction.correctedText) continue
    const index = text.indexOf(correction.originalText)
    if (index < 0) continue
    text = `${text.slice(0, index)}${correction.correctedText}${text.slice(index + correction.originalText.length)}`
  }
  return text
}

export function proofreadingDisplaySegments(
  sourceText: string,
  corrections: ProofreadingCorrection[]
): ProofreadingDisplaySegment[] {
  const effectiveText = applyProofreadingCorrections(sourceText, corrections)
  if (effectiveText === sourceText) return [{ text: sourceText, changed: false }]

  let prefixLength = 0
  const sharedLength = Math.min(sourceText.length, effectiveText.length)
  while (prefixLength < sharedLength && sourceText[prefixLength] === effectiveText[prefixLength]) {
    prefixLength += 1
  }

  let sourceSuffixIndex = sourceText.length
  let effectiveSuffixIndex = effectiveText.length
  while (
    sourceSuffixIndex > prefixLength
    && effectiveSuffixIndex > prefixLength
    && sourceText[sourceSuffixIndex - 1] === effectiveText[effectiveSuffixIndex - 1]
  ) {
    sourceSuffixIndex -= 1
    effectiveSuffixIndex -= 1
  }

  const segments: ProofreadingDisplaySegment[] = []
  const prefix = effectiveText.slice(0, prefixLength)
  const changed = effectiveText.slice(prefixLength, effectiveSuffixIndex)
  const suffix = effectiveText.slice(effectiveSuffixIndex)
  if (prefix) segments.push({ text: prefix, changed: false })
  if (changed) segments.push({ text: changed, changed: true })
  if (suffix) segments.push({ text: suffix, changed: false })
  return segments
}
