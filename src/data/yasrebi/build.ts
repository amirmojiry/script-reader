import type { Play, PlayBlock } from '../../types'
import type { RawPlaySource } from './types'

const palette = ['#ef9a9a', '#a5d6a7', '#90caf9', '#ce93d8', '#ffcc80', '#80cbc4', '#fff59d', '#f48fb1']

export function buildYasrebiPlay(source: RawPlaySource, author: string): Play {
  const characterIds = new Map(source.characters.map((name, index) => [name, `role-${String(index + 1).padStart(2, '0')}`]))
  const characters = source.characters.map((name, index) => ({
    id: characterIds.get(name) as string,
    name,
    color: palette[index % palette.length],
    gender: source.characterGenders?.[name] ?? 'unknown'
  }))

  const blocks: PlayBlock[] = source.records.map((record, index) => {
    const id = `block-${String(index + 1).padStart(4, '0')}`
    if (record[0] === 's') return { id, type: 'stage-direction', text: record[1] }

    const characterId = characterIds.get(record[1])
    if (!characterId) throw new Error(`Unknown character in ${source.id}: ${record[1]}`)
    return { id, type: 'dialogue', characterId, parts: [{ type: 'speech', text: record[2] }] }
  })

  return {
    id: `yasrebi-${source.id}`,
    title: source.title,
    author,
    genres: source.genres,
    characters,
    acts: [{
      id: 'act-1',
      title: 'نمایشنامه',
      scenes: [{ id: 'scene-1', title: 'متن کامل', blocks }]
    }]
  }
}
