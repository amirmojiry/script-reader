import type { Play, PlayBlock } from '../../types'
import { deathKnocksRecords } from './deathKnocksRecords'
import { socratesRecords } from './socratesRecords'
import type { WoodyAllenRecord } from './types'

interface WoodyAllenSource {
  id: string
  bundledId: string
  title: string
  author: string
  translator: string
  genres: string[]
  characters: Play['characters']
  records: WoodyAllenRecord[]
}

export const DEATH_KNOCKS_BUNDLED_ID = 'builtin:woody-allen:death-knocks'
export const SOCRATES_BUNDLED_ID = 'builtin:woody-allen:socrates'

export const woodyAllenSources: WoodyAllenSource[] = [
  {
    id: 'death-knocks',
    bundledId: DEATH_KNOCKS_BUNDLED_ID,
    title: 'مرگ در می‌زند',
    author: 'وودی آلن',
    translator: 'حسین یعقوبی',
    genres: ['کمدی', 'فلسفی'],
    characters: [
      { id: 'nat', name: 'نات', color: '#ef9a9a', gender: 'male' },
      { id: 'death', name: 'مرگ', color: '#90caf9', gender: 'male' }
    ],
    records: deathKnocksRecords
  },
  {
    id: 'socrates',
    bundledId: SOCRATES_BUNDLED_ID,
    title: 'در نقش سقراط',
    author: 'وودی آلن',
    translator: 'حسین یعقوبی',
    genres: ['کمدی', 'فلسفی'],
    characters: [
      { id: 'allen', name: 'آلن', color: '#ef9a9a', gender: 'male' },
      { id: 'agathon', name: 'آگاتن', color: '#a5d6a7', gender: 'male' },
      { id: 'simmias', name: 'سیمیاس', color: '#90caf9', gender: 'male' },
      { id: 'executioner', name: 'جلاد', color: '#ce93d8', gender: 'unknown' },
      { id: 'messenger', name: 'قاصد', color: '#ffcc80', gender: 'unknown' }
    ],
    records: socratesRecords
  }
]

function buildBlocks(source: WoodyAllenSource): PlayBlock[] {
  const characterIds = new Map(source.characters.map((character) => [character.name, character.id]))
  return source.records.map((record, index) => {
    const id = `block-${String(index + 1).padStart(4, '0')}`
    if (record[0] === 's') return { id, type: 'stage-direction', text: record[1] }
    const names = Array.isArray(record[1]) ? record[1] : [record[1]]
    const ownerIds = names.map((name) => {
      const characterId = characterIds.get(name)
      if (!characterId) throw new Error(`Unknown character in ${source.id}: ${name}`)
      return characterId
    })
    const characterId = ownerIds[0]
    if (!characterId) throw new Error(`Dialogue without character in ${source.id}`)
    return {
      id,
      type: 'dialogue',
      characterId,
      ...(ownerIds.length > 1 ? { characterIds: ownerIds } : {}),
      parts: [{ type: 'speech', text: record[2] }]
    }
  })
}

export function buildWoodyAllenPlay(source: WoodyAllenSource): Play {
  return {
    id: source.bundledId,
    title: source.title,
    author: source.author,
    translator: source.translator,
    genres: source.genres,
    characters: source.characters,
    acts: [{
      id: 'act-1',
      title: 'نمایشنامه',
      scenes: [{ id: 'scene-1', title: 'متن کامل', blocks: buildBlocks(source) }]
    }]
  }
}

export const woodyAllenBundledPlays = woodyAllenSources.map(buildWoodyAllenPlay)
