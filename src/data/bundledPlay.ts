import type { Play } from '../types'
import { blocks01 } from './horses/blocks01'
import { blocks02 } from './horses/blocks02'
import { blocks03 } from './horses/blocks03'
import { blocks04 } from './horses/blocks04'
import { blocks05 } from './horses/blocks05'
import { blocks06 } from './horses/blocks06'
import { blocks07 } from './horses/blocks07'
import { blocks08 } from './horses/blocks08'
import { blocks09 } from './horses/blocks09'

export const bundledPlay: Play = {
  id: 'horses-behind-the-window',
  title: 'اسب های پشت پنجره',
  author: 'ماتئی ویسنی یک',
  translator: 'تینوش نظم جو',
  genres: ['درام', 'ابزورد', 'ضدجنگ'],
  characters: [
    { id: 'messenger', name: 'پیک', color: '#ef9a9a', gender: 'unknown' },
    { id: 'mother', name: 'مادر', color: '#a5d6a7', gender: 'female' },
    { id: 'son', name: 'پسر', color: '#90caf9', gender: 'male' },
    { id: 'daughter', name: 'دختر', color: '#ce93d8', gender: 'female' },
    { id: 'father', name: 'پدر', color: '#ffcc80', gender: 'male' },
    { id: 'woman', name: 'زن', color: '#80cbc4', gender: 'female' },
    { id: 'husband', name: 'شوهر', color: '#fff59d', gender: 'male' }
  ],
  acts: [{
    id: 'act-1',
    title: 'نمایشنامه',
    scenes: [{
      id: 'scene-1',
      title: 'متن کامل',
      blocks: [
        ...blocks01,
        ...blocks02,
        ...blocks03,
        ...blocks04,
        ...blocks05,
        ...blocks06,
        ...blocks07,
        ...blocks08,
        ...blocks09
      ]
    }]
  }]
}
