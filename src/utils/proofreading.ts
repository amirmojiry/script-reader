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
    originalOffset?: number
    sourceBlockText?: string
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
      ...(correction.originalOffset !== undefined ? { originalOffset: correction.originalOffset } : {}),
      ...(correction.sourceBlockText !== undefined ? { sourceBlockText: correction.sourceBlockText } : {}),
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

function correctedSnapshotMatchesAtOffset(
  sourceText: string,
  correction: ProofreadingCorrection
): boolean {
  const snapshot = correction.sourceBlockText
  const offset = correction.originalOffset
  if (!snapshot || offset === undefined || offset < 0 || !correction.correctedText) return false

  const suffix = snapshot.slice(offset + correction.originalText.length)
  for (let contextLength = 0; contextLength <= suffix.length; contextLength += 1) {
    const correctedWindow = correction.correctedText + suffix.slice(0, contextLength)
    const unchangedWindow = snapshot.slice(offset, offset + correctedWindow.length)
    if (correctedWindow === unchangedWindow) continue

    return sourceText.slice(offset, offset + correctedWindow.length) === correctedWindow
  }

  return false
}

export function applyProofreadingCorrections(
  sourceText: string,
  corrections: ProofreadingCorrection[]
): string {
  let text = sourceText
  for (const correction of sortCorrections(corrections)) {
    if (!correction.originalText || correction.originalText === correction.correctedText) continue
    const offset = correction.originalOffset
    const exactIndex = offset !== undefined
      && offset >= 0
      && text.slice(offset, offset + correction.originalText.length) === correction.originalText
      ? offset
      : -1

    const correctedMatchesAtOffset = Boolean(
      correction.correctedText
      && offset !== undefined
      && offset >= 0
      && text.slice(offset, offset + correction.correctedText.length) === correction.correctedText
    )
    const snapshotCorrectionAlreadyApplied = correctedSnapshotMatchesAtOffset(text, correction)

    const legacyLengtheningLooksBaked = correction.sourceBlockText === undefined
      && correction.correctedText.length > correction.originalText.length

    if (
      correctedMatchesAtOffset
      && (
        exactIndex < 0
        || snapshotCorrectionAlreadyApplied
        || legacyLengtheningLooksBaked
      )
    ) {
      continue
    }

    const sourceSnapshotChanged = correction.sourceBlockText !== undefined
      && correction.sourceBlockText !== sourceText
    if (sourceSnapshotChanged && offset !== undefined && exactIndex < 0) {
      continue
    }

    const fallbackIndex = exactIndex >= 0 ? exactIndex : text.indexOf(correction.originalText)

    if (offset === undefined && correction.correctedText) {
      const correctedIndex = text.indexOf(correction.correctedText)
      if (correctedIndex >= 0) {
        if (fallbackIndex < 0) continue
        const originalInsideCorrected = fallbackIndex >= correctedIndex
          && fallbackIndex + correction.originalText.length <= correctedIndex + correction.correctedText.length
        if (originalInsideCorrected) continue
      }
    }

    if (fallbackIndex < 0) continue
    text = `${text.slice(0, fallbackIndex)}${correction.correctedText}${text.slice(fallbackIndex + correction.originalText.length)}`
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
