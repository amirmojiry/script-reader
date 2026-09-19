import type { Play, PlayBlock } from '../../types'
import { act1Records01 } from './act1Records01'
import { act1Records02 } from './act1Records02'
import { act1Records03 } from './act1Records03'
import { act1Records04 } from './act1Records04'
import { act2Records01 } from './act2Records01'
import { act2Records02 } from './act2Records02'
import { act2Records03 } from './act2Records03'
import { act2Records04 } from './act2Records04'
import type { DarioFoRecord } from './types'

interface DarioFoActSource {
  id: string
  title: string
  records: DarioFoRecord[]
}

interface DarioFoSource {
  id: string
  title: string
  author: string
  translator: string
  genres: string[]
  characters: Play['characters']
  acts: DarioFoActSource[]
}

export const HESAB_PARDAKHT_NEMISHE_BUNDLED_ID = 'builtin:dario-fo:hesab-pardakht-nemishe'

export const hesabPardakhtNemisheSource: DarioFoSource = {
  id: 'hesab-pardakht-nemishe-dario-fo-fa',
  title: 'حساب پرداخت نمی‌شه!',
  author: 'داریو فو',
  translator: 'حامد جهانشاهی',
  genres: ['کمدی'],
  characters: [
    { id: 'antonia', name: 'آنتونیا', color: '#ef9a9a', gender: 'female' },
    { id: 'giovanni', name: 'جووانی', color: '#90caf9', gender: 'male' },
    { id: 'margherita', name: 'مارگریتا', color: '#ce93d8', gender: 'female' },
    { id: 'luigi', name: 'لوئیجی', color: '#ffcc80', gender: 'male' },
    { id: 'policeman', name: 'پاسبان', color: '#80cbc4', gender: 'male' },
    { id: 'gendarme', name: 'ژاندارم', color: '#fff59d', gender: 'male' },
    { id: 'old-man', name: 'پیرمرد', color: '#a5d6a7', gender: 'male' },
    { id: 'gravedigger', name: 'گورکن', color: '#f48fb1', gender: 'male' },
    { id: 'police-officers', name: 'ماموران پلیس', color: '#b0bec5', gender: 'unknown' },
    { id: 'giovanni-antonia', name: 'جووانی و آنتونیا', color: '#b0bec5', gender: 'unknown' },
    { id: 'antonia-margherita', name: 'آنتونیا و مارگریتا', color: '#b0bec5', gender: 'unknown' },
    { id: 'giovanni-luigi', name: 'جووانی و لوئیجی', color: '#b0bec5', gender: 'unknown' },
    { id: 'all', name: 'همگی', color: '#b0bec5', gender: 'unknown' }
  ],
  acts: [
    {
      id: 'act-1',
      title: 'پرده اول',
      records: [...act1Records01, ...act1Records02, ...act1Records03, ...act1Records04]
    },
    {
      id: 'act-2',
      title: 'پرده دوم',
      records: [...act2Records01, ...act2Records02, ...act2Records03, ...act2Records04]
    }
  ]
}

function buildBlocks(records: DarioFoRecord[], actNumber: number, characterIds: Map<string, string>): PlayBlock[] {
  return records.map((record, index) => {
    const id = `a${actNumber}-b${String(index + 1).padStart(4, '0')}`
    if (record[0] === 's') return { id, type: 'stage-direction', text: record[1] }

    const characterId = characterIds.get(record[1])
    if (!characterId) throw new Error(`Unknown character in ${hesabPardakhtNemisheSource.id}: ${record[1]}`)
    return { id, type: 'dialogue', characterId, parts: [{ type: 'speech', text: record[2] }] }
  })
}

export function buildHesabPardakhtNemishePlay(source: DarioFoSource = hesabPardakhtNemisheSource): Play {
  const characterIds = new Map(source.characters.map((character) => [character.name, character.id]))

  return {
    id: HESAB_PARDAKHT_NEMISHE_BUNDLED_ID,
    title: source.title,
    author: source.author,
    translator: source.translator,
    genres: source.genres,
    characters: source.characters,
    acts: source.acts.map((act, index) => ({
      id: act.id,
      title: act.title,
      scenes: [{
        id: `scene-${index + 1}`,
        title: act.title,
        blocks: buildBlocks(act.records, index + 1, characterIds)
      }]
    }))
  }
}

export const hesabPardakhtNemishePlay = buildHesabPardakhtNemishePlay()
