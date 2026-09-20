import type { CharacterGender, Play } from '../types'
import { analyzeNarrator, characterDialogueText, characterGender, flattenBlocks, wordCount } from './play'

export interface PlayLibraryMetrics {
  characterCount: number
  dialogueCount: number
  spokenWordCount: number
  narratorWordCount: number
  estimatedMinutes: number
  maleCount: number
  femaleCount: number
  unknownCount: number
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

export type LibrarySortMode =
  | 'title-asc'
  | 'duration-asc'
  | 'duration-desc'
  | 'roles-asc'
  | 'roles-desc'

export interface PlayWizardCriteria {
  totalPeople: number
  malePeople: number
  femalePeople: number
  maxMinutes: number
  genres?: string[]
}

export interface PlayCardLike {
  play: Play
  metrics: PlayLibraryMetrics
}

export function playGenres(play: Play): string[] {
  if (!Array.isArray(play.genres)) return []
  return [...new Set(
    play.genres
      .filter((genre): genre is string => typeof genre === 'string')
      .map((genre) => genre.trim())
      .filter(Boolean)
  )]
}

export function playLibraryMetrics(play: Play): PlayLibraryMetrics {
  const narrator = analyzeNarrator(play)
  const spokenTexts = flattenBlocks(play).flatMap((block) => {
    if (block.type !== 'dialogue') return []
    const text = characterDialogueText(block)
    return text ? [text] : []
  })
  const spokenWordCount = spokenTexts.reduce((sum, text) => sum + wordCount(text), 0)
  const genders = play.characters.map((character) => characterGender(character.gender))
  const totalWords = spokenWordCount + narrator.wordCount

  return {
    characterCount: play.characters.length,
    dialogueCount: spokenTexts.length,
    spokenWordCount,
    narratorWordCount: narrator.wordCount,
    estimatedMinutes: totalWords === 0 ? 0 : Math.max(1, Math.ceil(totalWords / 130)),
    maleCount: genders.filter((gender) => gender === 'male').length,
    femaleCount: genders.filter((gender) => gender === 'female').length,
    unknownCount: genders.filter((gender) => gender === 'unknown').length
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

export function genderLabel(gender: CharacterGender | undefined): string {
  if (gender === 'male') return 'مرد'
  if (gender === 'female') return 'زن'
  return 'نامشخص'
}

export function matchesWizardCriteria(play: Play, metrics: PlayLibraryMetrics, criteria: PlayWizardCriteria): boolean {
  const totalPeople = Math.max(0, criteria.totalPeople)
  const malePeople = Math.max(0, Math.min(criteria.malePeople, totalPeople))
  const femalePeople = Math.max(0, Math.min(criteria.femalePeople, totalPeople))
  const maxMinutes = Math.max(0, criteria.maxMinutes)
  const remainingAfterTypedRoles = totalPeople - metrics.maleCount - metrics.femaleCount

  if (metrics.characterCount > totalPeople) return false
  if (metrics.maleCount > malePeople) return false
  if (metrics.femaleCount > femalePeople) return false
  if (metrics.unknownCount > remainingAfterTypedRoles) return false
  if (metrics.estimatedMinutes > maxMinutes) return false
  if (criteria.genres?.length) {
    const availableGenres = playGenres(play)
    if (!criteria.genres.some((genre) => availableGenres.includes(genre))) return false
  }
  return true
}

export function sortPlayCards<T extends PlayCardLike>(cards: T[], mode: LibrarySortMode): T[] {
  const collator = new Intl.Collator('fa')
  return [...cards].sort((left, right) => {
    if (mode === 'duration-asc') return left.metrics.estimatedMinutes - right.metrics.estimatedMinutes
    if (mode === 'duration-desc') return right.metrics.estimatedMinutes - left.metrics.estimatedMinutes
    if (mode === 'roles-asc') return left.metrics.characterCount - right.metrics.characterCount
    if (mode === 'roles-desc') return right.metrics.characterCount - left.metrics.characterCount
    return collator.compare(left.play.title, right.play.title)
  })
}
