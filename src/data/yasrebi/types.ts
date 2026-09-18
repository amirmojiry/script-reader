import type { CharacterGender } from '../../types'

export type RawPlayRecord = ['s', string] | ['d', string, string]

export interface RawPlaySource {
  id: string
  title: string
  genres: string[]
  characters: string[]
  characterGenders?: Partial<Record<string, CharacterGender>>
  records: RawPlayRecord[]
}
