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
    a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  )
}

export function proofreadingCorrectionsForBlock(
  corrections: ProofreadingCorrection[],
  blockId: string
): ProofreadingCorrection[] {
  return sortCorrections(corrections.filter((correction) => correction.blockId === blockId))
}

interface SnapshotResolution {
  status: 'apply' | 'baked'
  index?: number
}

interface ContextCandidate {
  index: number
  contextScore: number
  displacement: number
}

function commonPrefixLength(left: string, right: string): number {
  const limit = Math.min(left.length, right.length)
  let index = 0
  while (index < limit && left[index] === right[index]) index += 1
  return index
}

function commonSuffixLength(left: string, right: string): number {
  const limit = Math.min(left.length, right.length)
  let length = 0
  while (
    length < limit
    && left[left.length - 1 - length] === right[right.length - 1 - length]
  ) {
    length += 1
  }
  return length
}

function occurrenceIndexes(text: string, needle: string): number[] {
  if (!needle) return Array.from({ length: text.length + 1 }, (_, index) => index)

  const indexes: number[] = []
  for (let from = 0; from <= text.length - needle.length;) {
    const index = text.indexOf(needle, from)
    if (index < 0) break
    indexes.push(index)
    from = index + 1
  }
  return indexes
}

function contextCandidate(
  text: string,
  snapshot: string,
  offset: number,
  originalLength: number,
  candidateLength: number,
  index: number
): ContextCandidate {
  const leftContext = snapshot.slice(0, offset)
  const rightContext = snapshot.slice(offset + originalLength)
  return {
    index,
    contextScore:
      commonSuffixLength(leftContext, text.slice(0, index))
      + commonPrefixLength(rightContext, text.slice(index + candidateLength)),
    displacement: Math.abs(index - offset)
  }
}

function bestContextCandidate(
  text: string,
  snapshot: string,
  offset: number,
  originalLength: number,
  candidateText: string
): ContextCandidate | undefined {
  const ranked = occurrenceIndexes(text, candidateText)
    .map((index) => contextCandidate(
      text,
      snapshot,
      offset,
      originalLength,
      candidateText.length,
      index
    ))
    .sort((left, right) =>
      right.contextScore - left.contextScore
      || left.displacement - right.displacement
      || left.index - right.index
    )

  const best = ranked[0]
  const next = ranked[1]
  if (
    best
    && next
    && best.contextScore === next.contextScore
    && best.displacement === next.displacement
  ) {
    return undefined
  }
  return best
}

function resolveSnapshotCorrection(
  text: string,
  correction: ProofreadingCorrection
): SnapshotResolution | undefined {
  const snapshot = correction.sourceBlockText
  const offset = correction.originalOffset
  if (
    snapshot === undefined
    || offset === undefined
    || offset < 0
    || snapshot.slice(offset, offset + correction.originalText.length) !== correction.originalText
  ) {
    return undefined
  }

  const correctedSnapshot = `${snapshot.slice(0, offset)}${correction.correctedText}${snapshot.slice(offset + correction.originalText.length)}`
  if (text === snapshot) return { status: 'apply', index: offset }
  if (text === correctedSnapshot) return { status: 'baked' }

  const pending = bestContextCandidate(
    text,
    snapshot,
    offset,
    correction.originalText.length,
    correction.originalText
  )
  const baked = bestContextCandidate(
    text,
    snapshot,
    offset,
    correction.originalText.length,
    correction.correctedText
  )

  if (!pending) return baked ? { status: 'baked' } : undefined
  if (!baked) return { status: 'apply', index: pending.index }

  if (pending.contextScore !== baked.contextScore) {
    return pending.contextScore > baked.contextScore
      ? { status: 'apply', index: pending.index }
      : { status: 'baked' }
  }

  // Equal context evidence is ambiguous even when one candidate is closer to the
  // old absolute offset. Source insertions can move the real pending occurrence,
  // so preserve the user's edit whenever the original text still matches equally well.
  return { status: 'apply', index: pending.index }
}

export function applyProofreadingCorrections(
  sourceText: string,
  corrections: ProofreadingCorrection[]
): string {
  let text = sourceText
  for (const correction of sortCorrections(corrections)) {
    if (!correction.originalText || correction.originalText === correction.correctedText) continue

    const snapshotResolution = resolveSnapshotCorrection(text, correction)
    if (snapshotResolution) {
      if (snapshotResolution.status === 'baked') continue
      const index = snapshotResolution.index
      if (index === undefined) continue
      text = `${text.slice(0, index)}${correction.correctedText}${text.slice(index + correction.originalText.length)}`
      continue
    }

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
    const legacyLengtheningLooksBaked = correction.sourceBlockText === undefined
      && correction.correctedText.length > correction.originalText.length

    if (
      correctedMatchesAtOffset
      && (
        exactIndex < 0
        || legacyLengtheningLooksBaked
      )
    ) {
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
