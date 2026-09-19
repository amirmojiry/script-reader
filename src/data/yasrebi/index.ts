import { buildYasrebiPlay } from './build'
import type { RawPlaySource } from './types'
import { records01 as banoo01 } from './banoo_va_marde_mordeh/records01'
import { records02 as banoo02 } from './banoo_va_marde_mordeh/records02'
import { records03 as banoo03 } from './banoo_va_marde_mordeh/records03'
import { records04 as banoo04 } from './banoo_va_marde_mordeh/records04'
import { records01 as jenayat01 } from './jenayat_va_mokafeat/records01'
import { records02 as jenayat02 } from './jenayat_va_mokafeat/records02'
import { records01 as akset01 } from './akset_dasteh_jamei_ba_khanom_bozorg/records01'
import { records02 as akset02 } from './akset_dasteh_jamei_ba_khanom_bozorg/records02'
import { records03 as akset03 } from './akset_dasteh_jamei_ba_khanom_bozorg/records03'
import { records04 as akset04 } from './akset_dasteh_jamei_ba_khanom_bozorg/records04'

export const yasrebiAuthor = 'چیستا یثربی'

export const yasrebiSources: RawPlaySource[] = [
  {
    id: 'banoo_va_marde_mordeh',
    title: 'بانو و مرد مرده',
    genres: ['درام'],
    characters: ['زن', 'دختر', 'داوود', 'شهردار', 'دوست دختر'],
    characterGenders: {
      'زن': 'female',
      'دختر': 'female',
      'داوود': 'male',
      'شهردار': 'unknown',
      'دوست دختر': 'female'
    },
    records: [...banoo01, ...banoo02, ...banoo03, ...banoo04]
  },
  {
    id: 'jenayat_va_mokafeat',
    title: 'جنایت و مکافات',
    genres: ['درام', 'روان‌شناختی'],
    characters: ['راسکلنیکوف', 'سونیا', 'مادر', 'پیرزن', 'دونیا', 'بازپرس', 'کاترینا', 'پولیا'],
    characterGenders: {
      'راسکلنیکوف': 'male',
      'سونیا': 'female',
      'مادر': 'female',
      'پیرزن': 'female',
      'دونیا': 'female',
      'بازپرس': 'male',
      'کاترینا': 'female',
      'پولیا': 'female'
    },
    records: [...jenayat01, ...jenayat02]
  },
  {
    id: 'akset_dasteh_jamei_ba_khanom_bozorg',
    title: 'عکس دسته جمعی با خانم بزرگ',
    genres: ['درام', 'خانوادگی'],
    characters: ['ناصر', 'نادر', 'اکرم', 'ساناز', 'یعقوب'],
    characterGenders: {
      'ناصر': 'male',
      'نادر': 'male',
      'اکرم': 'female',
      'ساناز': 'female',
      'یعقوب': 'male'
    },
    records: [...akset01, ...akset02, ...akset03, ...akset04]
  }
]

export const yasrebiBundledPlays = yasrebiSources.map((source) => buildYasrebiPlay(source, yasrebiAuthor))
