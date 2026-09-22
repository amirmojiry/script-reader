import type { Play, PlayBlock } from '../types'
import { bundledPlay } from './bundledPlay'
import { hesabPardakhtNemishePlay } from './darioFo'
import { unexpectedGuestPlay } from './unexpectedGuest'
import { woodyAllenBundledPlays } from './woodyAllen'
import { yasrebiBundledPlays } from './yasrebi'

export const BUNDLED_ID_PREFIX = 'builtin:'
export const bundledPlays: Play[] = [bundledPlay, ...yasrebiBundledPlays, hesabPardakhtNemishePlay, ...woodyAllenBundledPlays, unexpectedGuestPlay]

export interface ResolvedBundledPlay {
  play: Play
  ownedStoredId?: string
}

export function isReservedBundledId(id: string): boolean {
  return id.startsWith(BUNDLED_ID_PREFIX) || bundledPlays.some((play) => play.id === id)
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


interface LegacyTextMigration {
  from: string
  to: string
}

const legacyBundledTextMigrations: Record<string, Record<string, LegacyTextMigration>> = {
  'yasrebi-banoo_va_marde_mordeh': {
    'block-0002': { from: 'سلام کسی این جا نیست؟', to: 'سلام. کسی این جا نیست؟' },
    'block-0004': { from: 'ببخشید کسی نیست جواب بده؟', to: 'ببخشید. کسی نیست جواب بده؟' },
    'block-0005': { from: 'مرد جوان با خنده ی خُل خلی وارد میشود.', to: 'مرد جوان با خنده‌ی خُل‌خلی وارد میشود.' },
    'block-0006': { from: 'سلام ببخشید ماشین من یک کیلومتر پایین تر خراب شده با بدبختی خودمو رسوندم اینجا.', to: 'سلام. ببخشید، ماشین من یک کیلومتر پایین‌تر خراب شده. با بدبختی خودمو رسوندم اینجا.' },
    'block-0007': { from: 'مرد جوان با قیافه ی وحشت زده رم میکند و میرود.', to: 'مرد جوان با قیافه‌ی وحشت‌زده رم می‌کند و می‌رود.' },
    'block-0008': { from: 'آقا ببخشید؟... (با خودش) اینجا دیگه کجاست؟ (روی میز میزند) کسی تو این هتل نیست جواب آدمو بده؟', to: 'آقا، ببخشید؟... (با خودش) اینجا دیگه کجاست؟ (روی میز می‌زند) کسی تو این هتل نیست جواب آدمو بده؟' },
    'block-0009': { from: 'دختر جوانی با یک کیسه ی سیاه بزرگ در دستش وارد میشود آواز آسمان چشم او آیینه ی کیست؟ را میخواند با دیدن زن لحظه ای جا میخورد اما زود بر خودش مسلط میشود و لبخند میزند.', to: 'دختر جوانی با یک کیسه‌ی سیاه بزرگ در دستش وارد می‌شود. آواز «آسمان چشم او آیینه‌ی کیست؟» را می‌خواند. با دیدن زن لحظه‌ای جا می‌خورد؛ اما زود بر خودش مسلط می‌شود و لبخند می‌زند.' },
    'block-0010': { from: 'سلام خوش اومدین.', to: 'سلام. خوش اومدین.' },
    'block-0011': { from: 'سلام خانم... دیگه کم کم داشتم ناامید میشدم.', to: 'سلام خانم... دیگه کم کم داشتم ناامید می‌شدم.' },
    'block-0012': { from: 'خدا نکنه برای چی؟', to: 'خدا نکنه. برای چی؟' }
  }
}

function blockPlainText(block: PlayBlock): string | undefined {
  if (block.type === 'stage-direction') return block.text
  if (block.type === 'dialogue' && block.parts.length === 1 && block.parts[0].type === 'speech') {
    return block.parts[0].text
  }
  return undefined
}

function withBlockText(block: PlayBlock, text: string): PlayBlock {
  if (block.type === 'stage-direction') return { ...block, text }
  if (block.type === 'dialogue' && block.parts.length === 1 && block.parts[0].type === 'speech') {
    return { ...block, parts: [{ ...block.parts[0], text }] }
  }
  return block
}

function normalizeKnownLegacyBundledCopy(candidate: Play, bundled: Play): Play | undefined {
  const migrations = legacyBundledTextMigrations[bundled.id]
  if (!migrations) return undefined

  const blocks = candidate.acts.flatMap((act) => act.scenes.flatMap((scene) => scene.blocks))
  const blocksById = new Map(blocks.map((block) => [block.id, block]))
  const isExactLegacyRevision = Object.entries(migrations).every(([blockId, migration]) =>
    blockPlainText(blocksById.get(blockId) as PlayBlock) === migration.from
  )
  if (!isExactLegacyRevision) return undefined

  return {
    ...candidate,
    acts: candidate.acts.map((act) => ({
      ...act,
      scenes: act.scenes.map((scene) => ({
        ...scene,
        blocks: scene.blocks.map((block) => {
          const migration = migrations[block.id]
          return migration ? withBlockText(block, migration.to) : block
        })
      }))
    }))
  }
}

function isKnownLegacyBundledPlayCopy(candidate: Play, bundled: Play): boolean {
  const normalized = normalizeKnownLegacyBundledCopy(candidate, bundled)
  return Boolean(normalized && isBundledPlayCopy(normalized, bundled))
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
  usedIds: Set<string>,
  ownedStoredId?: string
): ResolvedBundledPlay {
  if (ownedStoredId) {
    const ownedStored = stored.find((play) => play.id === ownedStoredId)
    if (ownedStored) {
      return {
        play: mergeBundledPlay({ ...bundled, id: ownedStored.id }, ownedStored, bundled.id),
        ownedStoredId: ownedStored.id
      }
    }
  }

  const sameId = stored.find((play) => play.id === bundled.id)
  if (!sameId) return { play: bundled }

  if (isBundledPlayCopy(sameId, bundled) || isKnownLegacyBundledPlayCopy(sameId, bundled)) {
    return { play: mergeBundledPlay(bundled, sameId), ownedStoredId: sameId.id }
  }

  const fallbackBase = `${BUNDLED_ID_PREFIX}collision:${bundled.id}`
  let suffix = 1

  while (true) {
    const fallbackId = suffix === 1 ? fallbackBase : `${fallbackBase}-${suffix}`
    const fallbackStored = stored.find((play) => play.id === fallbackId)

    if (
      fallbackStored
      && (isBundledPlayCopy(fallbackStored, bundled) || isKnownLegacyBundledPlayCopy(fallbackStored, bundled))
    ) {
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
