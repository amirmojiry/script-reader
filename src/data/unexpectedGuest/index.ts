import type { CharacterGender, Play, PlayBlock } from '../../types'
import { records01 } from './records01'
import { records02 } from './records02'
import { records03 } from './records03'
import { records04 } from './records04'
import { records05 } from './records05'
import { records06 } from './records06'
import type { UnexpectedGuestRecord } from './types'

interface UnexpectedGuestSource {
  id: string
  title: string
  author: string
  translator: string
  genres: string[]
  characters: string[]
  characterGenders: Partial<Record<string, CharacterGender>>
  records: UnexpectedGuestRecord[]
}

const palette = ['#ef9a9a', '#a5d6a7', '#90caf9', '#ce93d8']

export const UNEXPECTED_GUEST_BUNDLED_ID = 'builtin:schmitt:unexpected-guest'

export const unexpectedGuestSource: UnexpectedGuestSource = {
  id: 'unexpected-guest',
  title: 'مهمان ناخوانده',
  author: 'اریک امانوئل اشمیت',
  translator: 'تینوش نظم‌جو',
  genres: ['درام', 'فلسفی'],
  characters: ['فروید', 'آنا', 'مأمور نازی', 'ناشناس'],
  characterGenders: {
    'فروید': 'male',
    'آنا': 'female',
    'مأمور نازی': 'male',
    'ناشناس': 'unknown'
  },
  records: [...records01, ...records02, ...records03, ...records04, ...records05, ...records06]
}

export function buildUnexpectedGuestPlay(source: UnexpectedGuestSource = unexpectedGuestSource): Play {
  const characterIds = new Map(source.characters.map((name, index) => [name, `role-${String(index + 1).padStart(2, '0')}`]))
  const characters = source.characters.map((name, index) => ({
    id: characterIds.get(name) as string,
    name,
    color: palette[index % palette.length],
    gender: source.characterGenders[name] ?? 'unknown'
  }))

  const blocks: PlayBlock[] = source.records.map((record, index) => {
    const id = `block-${String(index + 1).padStart(4, '0')}`
    if (record[0] === 's') return { id, type: 'stage-direction', text: record[1] }

    const characterId = characterIds.get(record[1])
    if (!characterId) throw new Error(`Unknown character in ${source.id}: ${record[1]}`)
    return { id, type: 'dialogue', characterId, parts: [{ type: 'speech', text: record[2] }] }
  })

  return {
    id: UNEXPECTED_GUEST_BUNDLED_ID,
    title: source.title,
    author: source.author,
    translator: source.translator,
    genres: source.genres,
    characters,
    acts: [{
      id: 'act-1',
      title: 'نمایشنامه',
      scenes: [{ id: 'scene-1', title: 'متن کامل', blocks }]
    }]
  }
}

export const unexpectedGuestPlay = buildUnexpectedGuestPlay()
