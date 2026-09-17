import type { Play } from '../types'
import { analyzePlay } from './play'

export interface PlayLibraryMetrics {
  characterCount: number
  dialogueCount: number
  spokenWordCount: number
  estimatedMinutes: number
}

export interface NumericBounds {
  min: number
  max: number
}

export interface LibraryMetricRanges {
  characterMin: number
  characterMax: number
  durationMin: number
  durationMax: number
}

export function playLibraryMetrics(play: Play): PlayLibraryMetrics {
  const stats = Object.values(analyzePlay(play))
  const spokenWordCount = stats.reduce((sum, entry) => sum + entry.wordCount, 0)
  return {
    characterCount: play.characters.length,
    dialogueCount: stats.reduce((sum, entry) => sum + entry.dialogueCount, 0),
    spokenWordCount,
    estimatedMinutes: spokenWordCount === 0 ? 0 : Math.max(1, Math.ceil(spokenWordCount / 130))
  }
}

export function numericBounds(values: number[]): NumericBounds {
  if (values.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...values), max: Math.max(...values) }
}

export function isWithinRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

export function matchesLibraryRanges(metrics: PlayLibraryMetrics, ranges: LibraryMetricRanges): boolean {
  return isWithinRange(metrics.characterCount, ranges.characterMin, ranges.characterMax)
    && isWithinRange(metrics.estimatedMinutes, ranges.durationMin, ranges.durationMax)
}
