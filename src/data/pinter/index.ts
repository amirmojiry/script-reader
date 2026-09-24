import type { Play, PlayBlock } from '../../types'
import { scene1Records, scene2Records, scene3Records } from './scenes01'
import { scene4Records, scene5Records, scene6Records } from './scenes02'
import { scene7Records, scene8Records, scene9Records } from './scenes03'
import type { PinterRecord } from './types'

interface PinterSceneSource {
  id: string
  title: string
  records: PinterRecord[]
}

interface PinterSource {
  id: string
  title: string
  author: string
  translators: string[]
  genres: string[]
  characters: Play['characters']
  scenes: PinterSceneSource[]
}

export const BETRAYAL_BUNDLED_ID = 'builtin:pinter:betrayal'

export const betrayalSource: PinterSource = {
  id: 'betrayal-harold-pinter-fa',
  title: 'خیانت',
  author: 'هارولد پینتر',
  translators: ['نگار جواهریان', 'تینوش نظم‌جو'],
  genres: ['درام', 'روان‌شناختی'],
  characters: [
    { id: 'emma', name: 'اما', color: '#ef9a9a', gender: 'female' },
    { id: 'jerry', name: 'جری', color: '#90caf9', gender: 'male' },
    { id: 'robert', name: 'رابرت', color: '#a5d6a7', gender: 'male' },
    { id: 'waiter', name: 'پیشخدمت', color: '#ffcc80', gender: 'male' }
  ],
  scenes: [
    { id: 'scene-1', title: 'صحنه اول — ۱۹۷۷ (بهار)', records: scene1Records },
    { id: 'scene-2', title: 'صحنه دوم — ۱۹۷۷ (بهار، کمی بعد)', records: scene2Records },
    { id: 'scene-3', title: 'صحنه سوم — ۱۹۷۵ (زمستان)', records: scene3Records },
    { id: 'scene-4', title: 'صحنه چهارم — ۱۹۷۴ (پاییز)', records: scene4Records },
    { id: 'scene-5', title: 'صحنه پنجم — ۱۹۷۳ (تابستان)', records: scene5Records },
    { id: 'scene-6', title: 'صحنه ششم — ۱۹۷۳ (تابستان، کمی بعد)', records: scene6Records },
    { id: 'scene-7', title: 'صحنه هفتم — ۱۹۷۳ (تابستان، کمی بعد)', records: scene7Records },
    { id: 'scene-8', title: 'صحنه هشتم — ۱۹۷۱ (تابستان)', records: scene8Records },
    { id: 'scene-9', title: 'صحنه نهم — ۱۹۶۸ (زمستان)', records: scene9Records },
  ]
}

function buildBlocks(records: PinterRecord[], sceneNumber: number, characterIds: Map<string, string>): PlayBlock[] {
  return records.map((record, index) => {
    const id = `s${sceneNumber}-b${String(index + 1).padStart(4, '0')}`
    if (record[0] === 's') return { id, type: 'stage-direction', text: record[1] }

    const characterId = characterIds.get(record[1])
    if (!characterId) throw new Error(`Unknown character in ${betrayalSource.id}: ${record[1]}`)
    return { id, type: 'dialogue', characterId, parts: [{ type: 'speech', text: record[2] }] }
  })
}

export function buildBetrayalPlay(source: PinterSource = betrayalSource): Play {
  const characterIds = new Map(source.characters.map((character) => [character.name, character.id]))

  return {
    id: BETRAYAL_BUNDLED_ID,
    title: source.title,
    author: source.author,
    translators: source.translators,
    genres: source.genres,
    characters: source.characters,
    acts: [{
      id: 'act-1',
      title: 'نمایشنامه',
      scenes: source.scenes.map((scene, index) => ({
        id: scene.id,
        title: scene.title,
        blocks: buildBlocks(scene.records, index + 1, characterIds)
      }))
    }]
  }
}

export const betrayalPlay = buildBetrayalPlay()
