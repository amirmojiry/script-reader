import type { CharacterGender, DialogueBlock, Play, PlayBlock } from '../types'

export const DEFAULT_NARRATOR_COLOR = '#ddd6fe'

export interface CharacterStats {
  dialogueCount: number
  wordCount: number
  shareOfWords: number
  estimatedMinutes: number
  blockIndexes: number[]
}

export interface DialogueRenderSegment {
  type: 'speech' | 'narration'
  text: string
}

export interface PlayValidationResult {
  valid: boolean
  errors: string[]
}

export function flattenBlocks(play: Play): PlayBlock[] {
  return play.acts.flatMap((act) => act.scenes.flatMap((scene) => scene.blocks))
}

function contributorDisplayName(value: string): string {
  return value.normalize('NFKC').replace(/\s+/gu, ' ').trim()
}

export function normalizeContributorName(value: string): string {
  return contributorDisplayName(value)
    .replace(/[يى]/gu, 'ی')
    .replace(/ك/gu, 'ک')
    .replace(/[\u200c\s]+/gu, ' ')
    .trim()
    .toLocaleLowerCase('fa')
}

export function dedupeContributorNames(values: string[]): string[] {
  const names = new Map<string, string>()
  for (const rawValue of values) {
    const displayName = contributorDisplayName(rawValue)
    if (!displayName) continue
    const key = normalizeContributorName(displayName)
    const current = names.get(key)
    if (!current || (!current.includes('\u200c') && displayName.includes('\u200c'))) names.set(key, displayName)
  }
  return [...names.values()]
}

function legacyContributorNames(value: string | undefined): string[] {
  if (!value) return []
  return value.split(/\s*\/\s*/u).map((name) => name.trim()).filter(Boolean)
}

export function playAuthors(play: Pick<Play, 'author' | 'authors'>): string[] {
  const values = Array.isArray(play.authors) && play.authors.length > 0 ? play.authors : legacyContributorNames(play.author)
  return dedupeContributorNames(values)
}

export function playTranslators(play: Pick<Play, 'translator' | 'translators'>): string[] {
  const values = Array.isArray(play.translators) && play.translators.length > 0 ? play.translators : legacyContributorNames(play.translator)
  return dedupeContributorNames(values)
}

export function characterGender(gender: unknown): CharacterGender {
  return gender === 'male' || gender === 'female' || gender === 'unknown' ? gender : 'unknown'
}

export function splitParentheticalNarration(text: string): DialogueRenderSegment[] {
  const segments: DialogueRenderSegment[] = []
  let plainStart = 0
  let narrationStart = -1
  let depth = 0

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (char === '(') {
      if (depth === 0) {
        if (index > plainStart) segments.push({ type: 'speech', text: text.slice(plainStart, index) })
        narrationStart = index
      }
      depth += 1
      continue
    }

    if (char === ')' && depth > 0) {
      depth -= 1
      if (depth === 0 && narrationStart >= 0) {
        segments.push({ type: 'narration', text: text.slice(narrationStart, index + 1) })
        plainStart = index + 1
        narrationStart = -1
      }
    }
  }

  if (depth > 0 && narrationStart >= 0) {
    const previous = segments.at(-1)
    const unmatched = text.slice(narrationStart)
    if (previous?.type === 'speech') previous.text += unmatched
    else segments.push({ type: 'speech', text: unmatched })
    plainStart = text.length
  }

  if (plainStart < text.length) segments.push({ type: 'speech', text: text.slice(plainStart) })
  if (segments.length === 0 && text) segments.push({ type: 'speech', text })

  return segments.filter((segment) => segment.text.length > 0)
}

export function dialogueRenderSegments(block: DialogueBlock): DialogueRenderSegment[] {
  const segments = block.parts.flatMap((part) => {
    if (part.type === 'direction') return [{ type: 'narration' as const, text: `(${part.text})` }]
    return splitParentheticalNarration(part.text)
  })

  return segments.map((segment, index) => {
    if (index === 0) return segment
    const previous = segments[index - 1]
    if (/\s$/u.test(previous.text) || /^\s/u.test(segment.text)) return segment
    return { ...segment, text: ` ${segment.text}` }
  })
}

export function dialogueText(block: DialogueBlock): string {
  return block.parts.filter((part) => part.type === 'speech').map((part) => part.text).join(' ').trim()
}

export function dialogueCharacterIds(block: DialogueBlock): string[] {
  const ids = block.characterIds?.filter(Boolean) ?? []
  return ids.length > 0 ? [...new Set(ids)] : [block.characterId]
}

export function characterDialogueText(block: DialogueBlock): string {
  return dialogueRenderSegments(block)
    .filter((segment) => segment.type === 'speech')
    .map((segment) => segment.text)
    .join(' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

export function narrationTextFromDialogue(block: DialogueBlock): string {
  return dialogueRenderSegments(block)
    .filter((segment) => segment.type === 'narration')
    .map((segment) => segment.text)
    .join(' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

export function blockText(block: PlayBlock): string {
  if (block.type === 'dialogue') {
    return block.parts.map((part) => part.type === 'direction' ? `(${part.text})` : part.text).join(' ').trim()
  }
  if (block.type === 'stage-direction') return block.text
  return block.title
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/u).length : 0
}

export function analyzePlay(play: Play): Record<string, CharacterStats> {
  const stats: Record<string, CharacterStats> = {}
  const blocks = flattenBlocks(play)
  let totalWords = 0

  for (const character of play.characters) {
    stats[character.id] = { dialogueCount: 0, wordCount: 0, shareOfWords: 0, estimatedMinutes: 0, blockIndexes: [] }
  }

  blocks.forEach((block, index) => {
    if (block.type !== 'dialogue') return
    const spokenText = characterDialogueText(block)
    if (!spokenText) return
    const count = wordCount(spokenText)
    const owners = dialogueCharacterIds(block)
    for (const characterId of owners) {
      const entry = stats[characterId] ?? { dialogueCount: 0, wordCount: 0, shareOfWords: 0, estimatedMinutes: 0, blockIndexes: [] }
      entry.dialogueCount += 1
      entry.wordCount += count
      entry.estimatedMinutes = entry.wordCount / 130
      entry.blockIndexes.push(index)
      stats[characterId] = entry
    }
    totalWords += count * owners.length
  })

  for (const entry of Object.values(stats)) {
    entry.shareOfWords = totalWords === 0 ? 0 : (entry.wordCount / totalWords) * 100
  }

  return stats
}

export function analyzeNarrator(play: Play): CharacterStats {
  const blocks = flattenBlocks(play)
  const stats: CharacterStats = {
    dialogueCount: 0,
    wordCount: 0,
    shareOfWords: 0,
    estimatedMinutes: 0,
    blockIndexes: []
  }

  blocks.forEach((block, index) => {
    let text = ''
    if (block.type === 'stage-direction') text = block.text
    if (block.type === 'dialogue') text = narrationTextFromDialogue(block)
    if (!text.trim()) return

    stats.dialogueCount += 1
    stats.wordCount += wordCount(text)
    stats.blockIndexes.push(index)
  })

  const characterWords = Object.values(analyzePlay(play)).reduce((sum, item) => sum + item.wordCount, 0)
  const totalWords = characterWords + stats.wordCount
  stats.shareOfWords = totalWords === 0 ? 0 : (stats.wordCount / totalWords) * 100
  stats.estimatedMinutes = stats.wordCount / 130
  return stats
}

export function getDialogueIndexes(play: Play, characterId: string): number[] {
  return flattenBlocks(play)
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block.type === 'dialogue' && dialogueCharacterIds(block).includes(characterId) && Boolean(characterDialogueText(block)))
    .map(({ index }) => index)
}

export function getNarratorIndexes(play: Play): number[] {
  return analyzeNarrator(play).blockIndexes
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function safeCharacterColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

function validCharacterGender(value: unknown): value is CharacterGender {
  return value === 'male' || value === 'female' || value === 'unknown'
}

export function validatePlay(value: unknown): PlayValidationResult {
  const errors: string[] = []
  if (!isRecord(value)) return { valid: false, errors: ['ریشهٔ فایل باید یک شیء JSON باشد.'] }
  if (!nonEmptyString(value.id)) errors.push('شناسهٔ نمایشنامه (`id`) الزامی است.')
  if (!nonEmptyString(value.title)) errors.push('عنوان نمایشنامه (`title`) الزامی است.')
  if (value.author !== undefined && !nonEmptyString(value.author)) {
    errors.push('اگر author مشخص شده باشد باید یک رشتهٔ غیرخالی باشد.')
  }
  if (value.authors !== undefined && (!Array.isArray(value.authors) || value.authors.length === 0 || value.authors.some((author) => !nonEmptyString(author)))) {
    errors.push('اگر authors مشخص شده باشد باید آرایه‌ای غیرخالی از نام نویسندگان باشد.')
  }
  if (value.translator !== undefined && !nonEmptyString(value.translator)) {
    errors.push('اگر translator مشخص شده باشد باید یک رشتهٔ غیرخالی باشد.')
  }
  if (value.translators !== undefined && (!Array.isArray(value.translators) || value.translators.length === 0 || value.translators.some((translator) => !nonEmptyString(translator)))) {
    errors.push('اگر translators مشخص شده باشد باید آرایه‌ای غیرخالی از نام مترجمان باشد.')
  }
  if (value.genres !== undefined) {
    if (!Array.isArray(value.genres) || value.genres.length === 0 || value.genres.some((genre) => !nonEmptyString(genre))) {
      errors.push('اگر genres مشخص شده باشد باید آرایه‌ای غیرخالی از نام ژانرها باشد.')
    }
  }
  if (!Array.isArray(value.characters) || value.characters.length === 0) errors.push('حداقل یک شخصیت لازم است.')
  if (!Array.isArray(value.acts) || value.acts.length === 0) errors.push('حداقل یک پرده/بخش لازم است.')
  if (errors.length > 0) return { valid: false, errors }

  const characters = value.characters as unknown[]
  const characterIds = new Set<string>()
  characters.forEach((candidate, index) => {
    if (!isRecord(candidate) || !nonEmptyString(candidate.id) || !nonEmptyString(candidate.name)) {
      errors.push(`شخصیت شمارهٔ ${index + 1} باید id و name معتبر داشته باشد.`)
      return
    }
    if (characterIds.has(candidate.id)) errors.push(`شناسهٔ شخصیت تکراری است: ${candidate.id}`)
    if (candidate.color !== undefined && !safeCharacterColor(candidate.color)) {
      errors.push(`رنگ شخصیت ${candidate.id} باید در قالب #RRGGBB باشد.`)
    }
    if (candidate.gender !== undefined && !validCharacterGender(candidate.gender)) {
      errors.push(`gender شخصیت ${candidate.id} باید male، female یا unknown باشد.`)
    }
    characterIds.add(candidate.id)
  })

  const actIds = new Set<string>()
  const sceneIds = new Set<string>()
  const blockIds = new Set<string>()
  ;(value.acts as unknown[]).forEach((actCandidate, actIndex) => {
    if (!isRecord(actCandidate) || !nonEmptyString(actCandidate.id) || !nonEmptyString(actCandidate.title) || !Array.isArray(actCandidate.scenes)) {
      errors.push(`پرده/بخش شمارهٔ ${actIndex + 1} باید id، title و scenes معتبر داشته باشد.`)
      return
    }
    if (actIds.has(actCandidate.id)) errors.push(`شناسهٔ پرده/بخش تکراری است: ${actCandidate.id}`)
    actIds.add(actCandidate.id)
    actCandidate.scenes.forEach((sceneCandidate, sceneIndex) => {
      if (!isRecord(sceneCandidate) || !nonEmptyString(sceneCandidate.id) || !nonEmptyString(sceneCandidate.title) || !Array.isArray(sceneCandidate.blocks)) {
        errors.push(`صحنهٔ ${sceneIndex + 1} در بخش ${actIndex + 1} باید id، title و blocks معتبر داشته باشد.`)
        return
      }
      if (sceneIds.has(sceneCandidate.id)) errors.push(`شناسهٔ صحنه تکراری است: ${sceneCandidate.id}`)
      sceneIds.add(sceneCandidate.id)
      sceneCandidate.blocks.forEach((blockCandidate, blockIndex) => {
        if (!isRecord(blockCandidate) || !nonEmptyString(blockCandidate.id) || !nonEmptyString(blockCandidate.type)) {
          errors.push(`بلوک ${blockIndex + 1} در صحنهٔ ${sceneIndex + 1} معتبر نیست.`)
          return
        }
        if (blockIds.has(blockCandidate.id)) errors.push(`شناسهٔ بلوک تکراری است: ${blockCandidate.id}`)
        blockIds.add(blockCandidate.id)

        if (blockCandidate.type === 'dialogue') {
          if (!nonEmptyString(blockCandidate.characterId) || !characterIds.has(blockCandidate.characterId)) {
            errors.push(`دیالوگ ${blockCandidate.id} به شخصیت ناشناخته اشاره می‌کند.`)
          }
          if (blockCandidate.characterIds !== undefined) {
            if (!Array.isArray(blockCandidate.characterIds) || blockCandidate.characterIds.length === 0
              || blockCandidate.characterIds.some((id) => !nonEmptyString(id) || !characterIds.has(id))
              || new Set(blockCandidate.characterIds).size !== blockCandidate.characterIds.length
              || !blockCandidate.characterIds.includes(blockCandidate.characterId)) {
              errors.push(`characterIds دیالوگ ${blockCandidate.id} باید آرایه‌ای یکتا از شخصیت‌های معتبر و شامل characterId باشد.`)
            }
          }
          if (!Array.isArray(blockCandidate.parts) || blockCandidate.parts.length === 0) {
            errors.push(`دیالوگ ${blockCandidate.id} باید حداقل یک part داشته باشد.`)
            return
          }
          blockCandidate.parts.forEach((part, partIndex) => {
            if (!isRecord(part) || (part.type !== 'speech' && part.type !== 'direction') || !nonEmptyString(part.text)) {
              errors.push(`part شمارهٔ ${partIndex + 1} در دیالوگ ${blockCandidate.id} معتبر نیست.`)
            }
          })
        } else if (blockCandidate.type === 'stage-direction') {
          if (!nonEmptyString(blockCandidate.text)) errors.push(`توضیح صحنه ${blockCandidate.id} متن معتبر ندارد.`)
        } else if (blockCandidate.type === 'section') {
          if (!nonEmptyString(blockCandidate.title)) errors.push(`بخش نمایشی ${blockCandidate.id} عنوان معتبر ندارد.`)
        } else {
          errors.push(`نوع بلوک ناشناخته است: ${String(blockCandidate.type)}`)
        }
      })
    })
  })

  return { valid: errors.length === 0, errors }
}

export function isPlay(value: unknown): value is Play {
  return validatePlay(value).valid
}
