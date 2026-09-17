import type { Play } from '../types'
import { bundledPlay } from './bundledPlay'
import { yasrebiBundledPlays } from './yasrebi'

export const bundledPlays: Play[] = [bundledPlay, ...yasrebiBundledPlays]

export function mergeBundledPlay(bundled: Play, existing?: Play): Play {
  if (!existing) return bundled

  const colorsById = new Map(existing.characters.map((character) => [character.id, character.color]))
  const colorsByName = new Map(existing.characters.map((character) => [character.name, character.color]))

  return {
    ...bundled,
    characters: bundled.characters.map((character) => {
      const legacyId = bundled.id === bundledPlay.id && character.id === 'woman' ? 'wife' : undefined
      return {
        ...character,
        color: colorsById.get(character.id)
          ?? (legacyId ? colorsById.get(legacyId) : undefined)
          ?? colorsByName.get(character.name)
          ?? character.color
      }
    })
  }
}
