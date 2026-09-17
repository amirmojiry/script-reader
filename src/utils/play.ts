import type { DialogueBlock, Play, PlayBlock } from '../types'

export interface CharacterStats {
  dialogueCount: number
  wordCount: number
  shareOfWords: number
  estimatedMinutes: number
  blockIndexes: number[]
}

export interface PlayValidationResult {
  valid: boolean
  errors: string[]
}

export function flattenBlocks(play: Play): PlayBlock[] {
  return play.acts.flatMap((act) => act.scenes.flatMap((scene) => scene.blocks))
}

export function dialogueText(block: DialogueBlock): string {
  return block.parts.filter((part) => part.type === 'speech').map((part) => part.text).join(' ').trim()
}

export function blockText(block: PlayBlock): string {
  if (block.type === 'dialogue') return dialogueText(block)
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
    const count = wordCount(dialogueText(block))
    const entry = stats[block.characterId] ?? { dialogueCount: 0, wordCount: 0, shareOfWords: 0, estimatedMinutes: 0, blockIndexes: [] }
    entry.dialogueCount += 1
    entry.wordCount += count
    entry.estimatedMinutes = entry.wordCount / 130
    entry.blockIndexes.push(index)
    stats[block.characterId] = entry
    totalWords += count
  })

  for (const entry of Object.values(stats)) {
    entry.shareOfWords = totalWords === 0 ? 0 : (entry.wordCount / totalWords) * 100
  }

  return stats
}

export function getDialogueIndexes(play: Play, characterId: string): number[] {
  return flattenBlocks(play)
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block.type === 'dialogue' && block.characterId === characterId)
    .map(({ index }) => index)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function validatePlay(value: unknown): PlayValidationResult {
  const errors: string[] = []
  if (!isRecord(value)) return { valid: false, errors: ['ریشهٔ فایل باید یک شیء JSON باشد.'] }
  if (!nonEmptyString(value.id)) errors.push('شناسهٔ نمایشنامه (`id`) الزامی است.')
  if (!nonEmptyString(value.title)) errors.push('عنوان نمایشنامه (`title`) الزامی است.')
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
