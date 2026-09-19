import type { Play } from '../types'
import { bundledPlay } from './bundledPlay'
import { hesabPardakhtNemishePlay } from './darioFo'
import { unexpectedGuestPlay } from './unexpectedGuest'
import { yasrebiBundledPlays } from './yasrebi'

export const BUNDLED_ID_PREFIX = 'builtin:'
export const bundledPlays: Play[] = [bundledPlay, ...yasrebiBundledPlays, hesabPardakhtNemishePlay, unexpectedGuestPlay]

export interface ResolvedBundledPlay {
  play: Play
  ownedStoredId?: string
}

export function isReservedBundledId(id: string): boolean {
  return id.startsWith(BUNDLED_ID_PREFIX)
}

function bundledContentKey(play: Play): string {
  return JSON.stringify({
    title: play.title,
    author: play.author,
    translator: play.translator,
    characters: play.characters.map(({ id, name }) => ({ id, name })),
    acts: play.acts
  })
}

export function isBundledPlayCopy(candidate: Play, bundled: Play): boolean {
  return bundledContentKey(candidate) === bundledContentKey(bundled)
}

export function mergeBundledPlay(bundled: Play, existing?: Play, canonicalId = bundled.id): Play {
  if (!existing) return bundled

  const colorsById = new Map(existing.characters.map((character) => [character.id, character.color]))
  const colorsByName = new Map(existing.characters.map((character) => [character.name, character.color]))

  return {
    ...bundled,
    characters: bundled.characters.map((character) => {
      const legacyId = canonicalId === bundledPlay.id && character.id === 'woman' ? 'wife' : undefined
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

export function resolveBundledPlayForStorage(
  bundled: Play,
  stored: Play[],
  usedIds: Set<string>
): ResolvedBundledPlay {
  const sameId = stored.find((play) => play.id === bundled.id)
  if (!sameId) return { play: bundled }

  if (isBundledPlayCopy(sameId, bundled)) {
    return { play: mergeBundledPlay(bundled, sameId), ownedStoredId: sameId.id }
  }

  const fallbackBase = `${BUNDLED_ID_PREFIX}collision:${bundled.id}`
  let suffix = 1

  while (true) {
    const fallbackId = suffix === 1 ? fallbackBase : `${fallbackBase}-${suffix}`
    const fallbackStored = stored.find((play) => play.id === fallbackId)

    if (fallbackStored && isBundledPlayCopy(fallbackStored, bundled)) {
      return {
        play: mergeBundledPlay({ ...bundled, id: fallbackId }, fallbackStored, bundled.id),
        ownedStoredId: fallbackStored.id
      }
    }

    if (!usedIds.has(fallbackId)) {
      return { play: { ...bundled, id: fallbackId } }
    }

    suffix += 1
  }
}
