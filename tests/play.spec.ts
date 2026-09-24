import { describe, expect, it } from 'vitest'
import { demoPlay } from '../src/data/demo'
import {
  analyzeNarrator,
  analyzePlay,
  characterDialogueText,
  dedupeContributorNames,
  dialogueCharacterIds,
  dialogueRenderSegments,
  dialogueText,
  flattenBlocks,
  narrationTextFromDialogue,
  normalizeContributorName,
  playAuthors,
  playTranslators,
  splitParentheticalNarration,
  validatePlay,
  wordCount
} from '../src/utils/play'

describe('play utilities', () => {
  it('flattens scenes into a stable reading sequence', () => {
    const blocks = flattenBlocks(demoPlay)
    expect(blocks.length).toBeGreaterThan(20)
    expect(blocks[0]?.type).toBe('stage-direction')
  })

  it('preserves readable spacing between speech and direction render segments', () => {
    const block = {
      id: 'spacing',
      type: 'dialogue' as const,
      characterId: 'speaker',
      parts: [
        { type: 'speech' as const, text: 'اول.' },
        { type: 'direction' as const, text: 'آرام' },
        { type: 'speech' as const, text: 'دوم.' }
      ]
    }

    expect(dialogueRenderSegments(block).map((segment) => segment.text).join('')).toBe('اول. (آرام) دوم.')
  })

  it('counts only spoken text and not inline directions', () => {
    const block = flattenBlocks(demoPlay).find((candidate) => candidate.type === 'dialogue' && candidate.parts.some((part) => part.type === 'direction'))
    expect(block?.type).toBe('dialogue')
    if (block?.type !== 'dialogue') throw new Error('Expected dialogue block')
    expect(dialogueText(block)).not.toContain('صدای طبل')
    expect(wordCount(dialogueText(block))).toBeGreaterThan(0)
  })

  it('separates balanced parenthetical dialogue text for the narrator without rewriting source text', () => {
    const block = {
      id: 'anna',
      type: 'dialogue' as const,
      characterId: 'anna',
      parts: [{ type: 'speech' as const, text: '(شگفت‌زده بیدار می‌شود) من کجا بودم؟' }]
    }

    expect(splitParentheticalNarration(block.parts[0].text)).toEqual([
      { type: 'narration', text: '(شگفت‌زده بیدار می‌شود)' },
      { type: 'speech', text: ' من کجا بودم؟' }
    ])
    expect(characterDialogueText(block)).toBe('من کجا بودم؟')
    expect(narrationTextFromDialogue(block)).toBe('(شگفت‌زده بیدار می‌شود)')
    expect(dialogueText(block)).toBe('(شگفت‌زده بیدار می‌شود) من کجا بودم؟')
  })

  it('leaves unbalanced parentheses as character speech', () => {
    expect(splitParentheticalNarration('(ناتمام')).toEqual([{ type: 'speech', text: '(ناتمام' }])
  })

  it('calculates spoken-word share and estimated duration', () => {
    const stats = analyzePlay(demoPlay)
    const totalShare = Object.values(stats).reduce((sum, item) => sum + item.shareOfWords, 0)
    expect(totalShare).toBeCloseTo(100, 5)
    expect(stats.mother.dialogueCount).toBeGreaterThan(0)
    expect(stats.messenger.blockIndexes.length).toBe(stats.messenger.dialogueCount)
    expect(stats.mother.estimatedMinutes).toBeGreaterThan(0)
  })

  it('does not count narrator-only dialogue as a character line', () => {
    const play = structuredClone(demoPlay)
    const scene = play.acts[0].scenes[0]
    const index = scene.blocks.length
    scene.blocks.push({
      id: 'narrator-only-dialogue',
      type: 'dialogue',
      characterId: 'mother',
      parts: [{ type: 'speech', text: '(فقط برای راوی)' }]
    })

    const flattened = flattenBlocks(play)
    const absoluteIndex = flattened.findIndex((block) => block.id === 'narrator-only-dialogue')
    const characterStats = analyzePlay(play)
    const narratorStats = analyzeNarrator(play)

    expect(absoluteIndex).toBeGreaterThanOrEqual(index)
    expect(characterStats.mother.blockIndexes).not.toContain(absoluteIndex)
    expect(narratorStats.blockIndexes).toContain(absoluteIndex)
  })

  it('tracks stage directions and inline/parenthetical narration as narrator entries', () => {
    const narrator = analyzeNarrator(demoPlay)
    expect(narrator.dialogueCount).toBeGreaterThan(0)
    expect(narrator.wordCount).toBeGreaterThan(0)
    expect(narrator.blockIndexes.length).toBe(narrator.dialogueCount)
  })

  it('supports joint dialogue ownership without synthetic characters', () => {
    const play = structuredClone(demoPlay)
    const scene = play.acts[0].scenes[0]
    const owners = play.characters.slice(0, 2).map((character) => character.id)
    scene.blocks.push({
      id: 'joint-dialogue',
      type: 'dialogue',
      characterId: owners[0],
      characterIds: owners,
      parts: [{ type: 'speech', text: 'با هم.' }]
    })

    const block = scene.blocks.at(-1)
    expect(block?.type).toBe('dialogue')
    if (!block || block.type !== 'dialogue') throw new Error('Expected joint dialogue')
    expect(dialogueCharacterIds(block)).toEqual(owners)
    const absoluteIndex = flattenBlocks(play).indexOf(block)
    const stats = analyzePlay(play)
    expect(stats[owners[0]].blockIndexes).toContain(absoluteIndex)
    expect(stats[owners[1]].blockIndexes).toContain(absoluteIndex)
    expect(validatePlay(play)).toEqual({ valid: true, errors: [] })
  })

  it('validates the complete nested play contract', () => {
    expect(validatePlay(demoPlay)).toEqual({ valid: true, errors: [] })
    expect(validatePlay({ title: 'x' }).valid).toBe(false)
  })

  it('supports separate contributor arrays and normalizes Persian spacing variants for discovery', () => {
    const play = structuredClone(demoPlay)
    play.authors = ['نویسنده یک', 'نویسنده دو']
    delete play.author
    play.translators = ['تینوش نظم جو', 'تینوش نظم‌جو', 'نگار جواهریان']
    delete play.translator

    expect(playAuthors(play)).toEqual(['نویسنده یک', 'نویسنده دو'])
    expect(playTranslators(play)).toEqual(['تینوش نظم‌جو', 'نگار جواهریان'])
    expect(normalizeContributorName('تینوش نظم جو')).toBe(normalizeContributorName('تینوش نظم‌جو'))
    expect(dedupeContributorNames(['تینوش نظم جو', 'تینوش نظم‌جو'])).toEqual(['تینوش نظم‌جو'])
    expect(validatePlay(play)).toEqual({ valid: true, errors: [] })
  })

  it('keeps slash-separated legacy contributors discoverable as individuals', () => {
    const play = structuredClone(demoPlay)
    play.translator = 'نگار جواهریان / تینوش نظم‌جو'
    delete play.translators
    expect(playTranslators(play)).toEqual(['نگار جواهریان', 'تینوش نظم‌جو'])
  })

  it('rejects malformed plural contributor metadata', () => {
    const malformed = structuredClone(demoPlay) as unknown as Record<string, unknown>
    malformed.authors = ['نویسنده', '']
    malformed.translators = 'مترجم'
    const result = validatePlay(malformed)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('authors')
    expect(result.errors.join(' ')).toContain('translators')
  })

  it('rejects non-string author and translator metadata', () => {
    const malformedAuthor = structuredClone(demoPlay) as unknown as Record<string, unknown>
    malformedAuthor.author = 123
    const authorResult = validatePlay(malformedAuthor)
    expect(authorResult.valid).toBe(false)
    expect(authorResult.errors.join(' ')).toContain('author')

    const malformedTranslator = structuredClone(demoPlay) as unknown as Record<string, unknown>
    malformedTranslator.translator = { name: 'x' }
    const translatorResult = validatePlay(malformedTranslator)
    expect(translatorResult.valid).toBe(false)
    expect(translatorResult.errors.join(' ')).toContain('translator')
  })

  it('keeps legacy plays without gender/genres valid and rejects invalid metadata', () => {
    const legacy = structuredClone(demoPlay)
    legacy.characters.forEach((character) => delete character.gender)
    delete legacy.genres
    expect(validatePlay(legacy).valid).toBe(true)

    const malformedGender = structuredClone(demoPlay)
    ;(malformedGender.characters[0] as unknown as { gender: string }).gender = 'other'
    const genderResult = validatePlay(malformedGender)
    expect(genderResult.valid).toBe(false)
    expect(genderResult.errors.join(' ')).toContain('gender')

    const malformedGenres = structuredClone(demoPlay)
    malformedGenres.genres = ['']
    const genreResult = validatePlay(malformedGenres)
    expect(genreResult.valid).toBe(false)
    expect(genreResult.errors.join(' ')).toContain('genres')
  })

  it('rejects imported character colors that are not literal hex colors', () => {
    const malformed = structuredClone(demoPlay)
    malformed.characters[0].color = 'url(https://attacker.example/pixel)'

    const result = validatePlay(malformed)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('#RRGGBB')
  })

  it('rejects duplicate act/scene ids and missing titles', () => {
    const malformed = structuredClone(demoPlay)
    const firstAct = malformed.acts[0]
    const firstScene = firstAct.scenes[0]

    firstAct.scenes.push(structuredClone(firstScene))
    firstAct.scenes.push({ id: 'untitled-scene', title: '', blocks: [] })
    malformed.acts.push(structuredClone(firstAct))
    malformed.acts.push({ id: 'untitled-act', title: '', scenes: [] })

    const result = validatePlay(malformed)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('id، title و scenes')
    expect(result.errors.join(' ')).toContain('id، title و blocks')
    expect(result.errors.join(' ')).toContain('شناسهٔ پرده/بخش تکراری')
    expect(result.errors.join(' ')).toContain('شناسهٔ صحنه تکراری')
  })

  it('rejects duplicate block ids and unknown characters', () => {
    const malformed = structuredClone(demoPlay)
    const firstScene = malformed.acts[0].scenes[0]
    const firstDialogue = firstScene.blocks.find((block) => block.type === 'dialogue')
    if (!firstDialogue || firstDialogue.type !== 'dialogue') throw new Error('fixture has no dialogue')
    firstDialogue.characterId = 'missing-character'
    firstScene.blocks.push({ ...firstDialogue })
    const result = validatePlay(malformed)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('شخصیت ناشناخته')
    expect(result.errors.join(' ')).toContain('تکراری')
  })
})
