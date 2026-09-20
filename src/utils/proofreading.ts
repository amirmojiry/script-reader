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
