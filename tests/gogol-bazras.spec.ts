import { describe, expect, it } from 'vitest'
import { bundledPlays } from '../src/data/bundledPlays'
import { BAZRAS_BUNDLED_ID, bazrasPlay, bazrasSource } from '../src/data/gogol'
import type { DialogueBlock } from '../src/types'
import { dialogueText, flattenBlocks, validatePlay } from '../src/utils/play'

const expectedSceneCounts = [143, 147, 175, 500]

function hasBalancedParentheses(text: string): boolean {
  let depth = 0

  for (const character of text) {
    if (character === '(') depth += 1
    if (character === ')') {
      depth -= 1
      if (depth < 0) return false
    }
  }

  return depth === 0
}

describe('Gogol Bazras bundled play', () => {
  it('preserves the complete source-reviewed canonical structure', () => {
    expect(bazrasSource.id).toBe('bazras-gogol-ghazi')
    expect(bazrasSource.acts).toHaveLength(2)
    expect(bazrasPlay.acts).toHaveLength(2)
    expect(validatePlay(bazrasPlay)).toEqual({ valid: true, errors: [] })

    const scenes = bazrasPlay.acts.flatMap((act) => act.scenes)
    expect(scenes).toHaveLength(4)
    expect(scenes.map((scene) => scene.blocks.length)).toEqual(expectedSceneCounts)
    expect(flattenBlocks(bazrasPlay)).toHaveLength(965)
  })

  it('keeps supplied metadata and explicit gender metadata for all roles', () => {
    expect(bazrasPlay).toMatchObject({
      id: BAZRAS_BUNDLED_ID,
      title: 'بازرس',
      author: 'نیکلای گوگول',
      translator: 'محمد قاضی',
      genres: ['کمدی']
    })
    expect(bazrasPlay.characters).toHaveLength(40)
    expect(bazrasPlay.characters.every((character) => ['male', 'female', 'unknown'].includes(character.gender ?? ''))).toBe(true)
  })

  it('keeps every dialogue parenthetical structurally balanced for narrator splitting', () => {
    const dialogues = flattenBlocks(bazrasPlay).filter((block): block is DialogueBlock => block.type === 'dialogue')

    for (const dialogue of dialogues) {
      expect(hasBalancedParentheses(dialogueText(dialogue)), dialogue.id).toBe(true)
    }
  })

  it('assigns all explicit collective responses to the ensemble role', () => {
    const collectiveCue = /\(\s*همه\s*با\s*هم\s*\)\s*\S/
    const dialogues = flattenBlocks(bazrasPlay).filter((block): block is DialogueBlock => block.type === 'dialogue')
    const collectiveResponses = dialogues.filter((dialogue) => collectiveCue.test(dialogueText(dialogue)))

    expect(collectiveResponses.map((dialogue) => dialogue.id)).toEqual([
      'line-0062a',
      'line-0362a',
      'line-0748a'
    ])
    expect(collectiveResponses.every((dialogue) => dialogue.characterId === 'ensemble')).toBe(true)
  })

  it('assigns every explicit Korobkin reading cue to Korobkin', () => {
    const readerCue = /کرو\s*بکین[^)]*می\s*[-‌]?\s*خواند/
    const dialogues = flattenBlocks(bazrasPlay).filter((block): block is DialogueBlock => block.type === 'dialogue')
    const readingBlocks = dialogues.filter((dialogue) => readerCue.test(dialogueText(dialogue)))

    expect(readingBlocks.map((dialogue) => dialogue.id)).toEqual([
      'line-0849a',
      'line-0850a',
      'line-0852a',
      'line-0855a',
      'line-0856a'
    ])
    expect(readingBlocks.every((dialogue) => dialogue.characterId === 'korobkin')).toBe(true)
  })


  it('contains no residual OCR speaker-label artifacts inside dialogue text', () => {
    const residualSpeakerCuePatterns = [
      /]نا\s*\*/,
      /خ(?:لی|لم)ستا\s*کوف\s*۰/,
      /دلیس\s*شهربانی\s*۰/,
      /پیشخدمت\s+آقا[،:]/,
      /پیشخدمت\s+مهمانخانه‌چی/,
      /همه\s*باهم\.\s*بخو/,
      /خلیستاکوف\s+الب/,
      /آن:\s*مزخرف/,
      /بکی‌از تجاه/,
      /هسرققگاز/,
      /خلیستا\s*گوف\s*؛/,
      /خلیستا\s*وف\s*۰/,
      /دئیس\s*بهدادی/,
      /دئیس\s*بهداای/,
      /رئیس\s*بهداای/
    ]
    const dialogues = flattenBlocks(bazrasPlay).filter((block): block is DialogueBlock => block.type === 'dialogue')

    for (const dialogue of dialogues) {
      const text = dialogueText(dialogue)
      for (const pattern of residualSpeakerCuePatterns) {
        expect(pattern.test(text), `${dialogue.id}: ${pattern}`).toBe(false)
      }
    }
  })

  it('preserves source speaker boundaries that OCR had joined across adjacent records', () => {
    const blocksById = new Map(flattenBlocks(bazrasPlay).map((block) => [block.id, block]))
    const expectedOwners = new Map([
      ['line-0007', 'culture-chief'],
      ['line-0007a', 'governor'],
      ['line-0016a', 'doctor'],
      ['line-0062a', 'ensemble'],
      ['line-0182a', 'waiter'],
      ['line-0184a', 'waiter'],
      ['line-0185a', 'waiter'],
      ['line-0200a', 'waiter'],
      ['line-0246a', 'khlestakov'],
      ['line-0257a', 'khlestakov'],
      ['line-0295a', 'anna'],
      ['line-0305a', 'anna'],
      ['line-0312a', 'anna'],
      ['line-0356a', 'anna'],
      ['line-0357a', 'anna'],
      ['line-0363a', 'health-chief'],
      ['line-0389a', 'health-chief'],
      ['line-0410a', 'anna'],
      ['line-0331a', 'mishka'],
      ['line-0499a', 'culture-chief'],
      ['line-0511a', 'health-chief'],
      ['line-0568a', 'osip'],
      ['line-0576a', 'khlestakov'],
      ['line-0583a', 'merchants'],
      ['line-0603a', 'locksmith-wife'],
      ['line-0634a', 'khlestakov'],
      ['line-0666a', 'anna'],
      ['line-0666b', 'khlestakov'],
      ['line-0668a', 'anna'],
      ['line-0668b', 'khlestakov'],
      ['line-0668c', 'anna'],
      ['line-0668d', 'khlestakov'],
      ['line-0791d', 'police-chief'],
      ['line-0810a', 'culture-chief-wife'],
      ['line-0827a', 'ensemble'],
      ['line-0849a', 'korobkin'],
      ['line-0850a', 'korobkin'],
      ['line-0852a', 'korobkin'],
      ['line-0855a', 'korobkin'],
      ['line-0856a', 'korobkin'],
      ['line-0880a', 'health-chief']
    ])

    for (const [blockId, characterId] of expectedOwners) {
      const block = blocksById.get(blockId)
      expect(block?.type, blockId).toBe('dialogue')
      expect((block as DialogueBlock).characterId, blockId).toBe(characterId)
    }
  })

  it('keeps restored page-boundary continuations and intervening narration intact', () => {
    const blocksById = new Map(flattenBlocks(bazrasPlay).map((block) => [block.id, block]))
    const anna = blocksById.get('line-0130') as DialogueBlock
    const abdulin = blocksById.get('line-0598') as DialogueBlock
    const khlestakov = blocksById.get('line-0599') as DialogueBlock
    const stage = blocksById.get('stage-0599a')
    const woman = blocksById.get('line-0600') as DialogueBlock

    expect(dialogueText(anna)).toContain('نمیداند که رئیس پست مسخره‌اش میکند.')
    expect(dialogueText(abdulin)).toContain('برای همیشه از دست فرماندار خلاص میشویم.')
    expect(dialogueText(khlestakov)).toBe('البته دوستان هر کاری که از دستم برآید کوتاهی نمیکنم!')
    expect(stage).toEqual({
      id: 'stage-0599a',
      type: 'stage-direction',
      text: 'تجار بیرون میروند و صدای زنی از دور شنیده میشود.'
    })
    expect(dialogueText(woman)).toMatch(/^حالا دیگه کتک زدن شما تمام شد\./)
  })

  it('keeps standalone narrator actions out of adjacent speakers after structural splits', () => {
    const blocksById = new Map(flattenBlocks(bazrasPlay).map((block) => [block.id, block]))

    expect(blocksById.get('stage-0034a')).toEqual({
      id: 'stage-0034a',
      type: 'stage-direction',
      text: 'رئیس پست وارد میشود. همه از ترس از جا می‌پرند.'
    })
    expect(blocksById.get('stage-0138a')).toEqual({
      id: 'stage-0138a',
      type: 'stage-direction',
      text: 'خلیستاکوف وارد میشود.'
    })
    expect(blocksById.get('stage-0430a')).toEqual({
      id: 'stage-0430a',
      type: 'stage-direction',
      text: 'پرده میافتد.'
    })
    expect(blocksById.get('stage-0389a')).toEqual({
      id: 'stage-0389a',
      type: 'stage-direction',
      text: 'هردو از اطاق بیرون میروند'
    })
    expect(blocksById.get('stage-0389b')).toEqual({
      id: 'stage-0389b',
      type: 'stage-direction',
      text: 'آنها از اطاق بیرون میروند'
    })
    expect(blocksById.get('stage-0568a')).toEqual({
      id: 'stage-0568a',
      type: 'stage-direction',
      text: 'اسیپ بیرون میرود و از دور صدایش بگوش میرسد'
    })
    expect(blocksById.get('stage-0603a')).toEqual({
      id: 'stage-0603a',
      type: 'stage-direction',
      text: 'همسر قفل‌ساز و زن گروهبان وارد میشوند'
    })
    expect(blocksById.get('stage-0810a')).toEqual({
      id: 'stage-0810a',
      type: 'stage-direction',
      text: 'رئیس پست وارد میشود درحالیکه نامه‌ای را در دست تکان میدهد.'
    })
    expect(blocksById.get('stage-0848a')).toEqual({
      id: 'stage-0848a',
      type: 'stage-direction',
      text: 'همه با هم فریاد میزنند و سر و صدا میکنند.'
    })
    expect(blocksById.get('stage-0880a')).toEqual({
      id: 'stage-0880a',
      type: 'stage-direction',
      text: 'دور آنها حلقه میزنند.'
    })
  })

  it('keeps the culture/health-chief handoff from PDF p. 95 on separate roles', () => {
    const blocksById = new Map(flattenBlocks(bazrasPlay).map((block) => [block.id, block]))

    const cultureChief = blocksById.get('line-0363') as DialogueBlock
    const healthChief = blocksById.get('line-0363a') as DialogueBlock

    expect(cultureChief.characterId).toBe('culture-chief')
    expect(dialogueText(cultureChief)).toBe('قربان ...')
    expect(healthChief.characterId).toBe('health-chief')
    expect(dialogueText(healthChief)).toBe('ما همیشه سرپا هستیم. اهمیت ندارد شماآسوده باشید قربان. ما مقام خود را میشناسیم ...')
  })

  it('keeps reviewed mid-scene handoffs on their actual speakers', () => {
    const blocksById = new Map(flattenBlocks(bazrasPlay).map((block) => [block.id, block]))

    expect(dialogueText(blocksById.get('line-0246') as DialogueBlock)).toBe('آقا دنبال من فرستاده بودید.')
    expect(dialogueText(blocksById.get('line-0246a') as DialogueBlock)).toContain('صورتحساب را میخو اهم.')

    expect(dialogueText(blocksById.get('line-0305') as DialogueBlock)).toContain('تمام راه را دویده‌ام')
    expect(dialogueText(blocksById.get('line-0305a') as DialogueBlock)).toMatch(/^خجالت آور است!/)

    expect(dialogueText(blocksById.get('line-0389a') as DialogueBlock)).toContain('ما حتی لباسهای رسمی هم نپوشیده‌ایم')
    expect(dialogueText(blocksById.get('line-0511') as DialogueBlock)).toBe('واقعاً اینطور است؟')
    expect(dialogueText(blocksById.get('line-0511a') as DialogueBlock)).toContain('دراینجا ملاکی بنام دوبچینسکی است')

    expect(dialogueText(blocksById.get('line-0568') as DialogueBlock)).toBe('خیلی خوب. اما برای من یک شمع بیاور.')
    expect(dialogueText(blocksById.get('line-0568a') as DialogueBlock)).toMatch(/^آهای داداش/)
    expect(dialogueText(blocksById.get('line-0634') as DialogueBlock)).toContain('مزاحم هستم؟')
    expect(dialogueText(blocksById.get('line-0634a') as DialogueBlock)).toContain('چه کاری برای من ازنگاه کردن‌بچشمان زیبای‌شما مهمتراست؟')
  })

  it('restores source endings in the final gathering', () => {
    const blocksById = new Map(flattenBlocks(bazrasPlay).map((block) => [block.id, block]))
    const text = (id: string) => dialogueText(blocksById.get(id) as DialogueBlock)

    expect(text('line-0771')).toContain('بنشینید. خواهش میکنم.')
    expect(text('line-0772')).toContain('درست از اول تعریف کنید.')
    expect(text('line-0779')).toContain('من که نگفتم اینطور نبود.')
    expect(text('line-0790')).toContain('برای این ازدواج بگیرند.')
    expect(text('line-0796')).toContain('آرزوی سعادت میکنم.')
    expect(text('line-0806')).toContain('کوتاهی نمیکنم شما مرا خوب میشناسید.')
    expect(text('line-0808')).toContain('برای کمک کردن به‌دوست وقت هست.')
  })

  it('keeps stable source block ids and beginning/end sentinels', () => {
    const scenes = bazrasPlay.acts.flatMap((act) => act.scenes)

    expect(scenes[0].blocks[0]?.id).toBe('stage-0001')
    expect(scenes[0].blocks.at(-1)?.id).toBe('line-0136')
    expect(scenes[1].blocks[0]?.id).toBe('stage-0137')
    expect(scenes[1].blocks.at(-1)?.id).toBe('line-0269')
    expect(scenes[2].blocks[0]?.id).toBe('stage-0270')
    expect(scenes[2].blocks.at(-1)?.id).toBe('stage-0430a')
    expect(scenes[3].blocks[0]?.id).toBe('stage-0431')
    expect(scenes[3].blocks.at(-1)?.id).toBe('line-0884')
  })

  it('is exposed once in the bundled catalog with a reserved unique id', () => {
    expect(BAZRAS_BUNDLED_ID).toBe('builtin:gogol:bazras')
    expect(bundledPlays.filter((play) => play.id === BAZRAS_BUNDLED_ID)).toHaveLength(1)
    expect(new Set(bundledPlays.map((play) => play.id)).size).toBe(bundledPlays.length)
  })
})
