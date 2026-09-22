import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BUNDLED_ID_PREFIX } from '../src/data/bundledPlays'
import { unexpectedGuestPlay } from '../src/data/unexpectedGuest'
import { yasrebiBundledPlays } from '../src/data/yasrebi'
import { usePlaysStore } from '../src/stores/plays'
import type { Play } from '../src/types'

const storageMocks = vi.hoisted(() => ({
  listPlays: vi.fn(),
  savePlay: vi.fn(),
  deletePlay: vi.fn(),
  getBundledPlayOwnership: vi.fn(),
  saveBundledPlayOwnership: vi.fn()
}))

vi.mock('../src/services/storage', () => ({
  listPlays: storageMocks.listPlays,
  savePlay: storageMocks.savePlay,
  deletePlay: storageMocks.deletePlay,
  getBundledPlayOwnership: storageMocks.getBundledPlayOwnership,
  saveBundledPlayOwnership: storageMocks.saveBundledPlayOwnership
}))

describe('bundled play ID collisions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    storageMocks.listPlays.mockReset()
    storageMocks.savePlay.mockReset()
    storageMocks.deletePlay.mockReset()
    storageMocks.getBundledPlayOwnership.mockReset()
    storageMocks.saveBundledPlayOwnership.mockReset()
    storageMocks.savePlay.mockResolvedValue(undefined)
    storageMocks.deletePlay.mockResolvedValue(undefined)
    storageMocks.getBundledPlayOwnership.mockResolvedValue({})
    storageMocks.saveBundledPlayOwnership.mockResolvedValue(undefined)
  })

  it('migrates the previous bundled Banoo revision in place and records durable ownership', async () => {
    const current = yasrebiBundledPlays[0]
    const legacy = JSON.parse(JSON.stringify(current)) as Play
    const legacyTexts: Record<string, string> = {
      'block-0002': 'سلام کسی این جا نیست؟',
      'block-0004': 'ببخشید کسی نیست جواب بده؟',
      'block-0005': 'مرد جوان با خنده ی خُل خلی وارد میشود.',
      'block-0006': 'سلام ببخشید ماشین من یک کیلومتر پایین تر خراب شده با بدبختی خودمو رسوندم اینجا.',
      'block-0007': 'مرد جوان با قیافه ی وحشت زده رم میکند و میرود.',
      'block-0008': 'آقا ببخشید؟... (با خودش) اینجا دیگه کجاست؟ (روی میز میزند) کسی تو این هتل نیست جواب آدمو بده؟',
      'block-0009': 'دختر جوانی با یک کیسه ی سیاه بزرگ در دستش وارد میشود آواز آسمان چشم او آیینه ی کیست؟ را میخواند با دیدن زن لحظه ای جا میخورد اما زود بر خودش مسلط میشود و لبخند میزند.',
      'block-0010': 'سلام خوش اومدین.',
      'block-0011': 'سلام خانم... دیگه کم کم داشتم ناامید میشدم.',
      'block-0012': 'خدا نکنه برای چی؟'
    }
    for (const block of legacy.acts.flatMap((act) => act.scenes.flatMap((scene) => scene.blocks))) {
      const text = legacyTexts[block.id]
      if (!text) continue
      if (block.type === 'stage-direction') block.text = text
      if (block.type === 'dialogue') block.parts = [{ type: 'speech', text }]
    }
    legacy.characters[0] = { ...legacy.characters[0], color: '#123456' }
    storageMocks.listPlays.mockResolvedValue([legacy])

    const store = usePlaysStore()
    await store.initialize()

    const canonical = store.plays.filter((play) => play.id === current.id)
    expect(canonical).toHaveLength(1)
    expect(canonical[0].acts).toEqual(current.acts)
    expect(canonical[0].characters[0].color).toBe('#123456')
    expect(store.plays.some((play) => play.id.startsWith(`${BUNDLED_ID_PREFIX}collision:${current.id}`))).toBe(false)
    expect(storageMocks.saveBundledPlayOwnership).toHaveBeenCalledWith(
      expect.objectContaining({ [current.id]: current.id })
    )
  })

  it('uses a durable ownership marker when bundled content changes again', async () => {
    const staleOwnedCopy: Play = {
      ...unexpectedGuestPlay,
      title: 'عنوان قدیمی نسخهٔ داخلی'
    }
    storageMocks.listPlays.mockResolvedValue([staleOwnedCopy])
    storageMocks.getBundledPlayOwnership.mockResolvedValue({
      [unexpectedGuestPlay.id]: unexpectedGuestPlay.id
    })

    const store = usePlaysStore()
    await store.initialize()

    expect(store.plays.find((play) => play.id === unexpectedGuestPlay.id)?.title)
      .toBe(unexpectedGuestPlay.title)
    expect(store.plays.some((play) =>
      play.id.startsWith(`${BUNDLED_ID_PREFIX}collision:${unexpectedGuestPlay.id}`)
    )).toBe(false)
  })

  it('preserves an older user import when its id collides with a bundled play', async () => {
    const userImport: Play = {
      ...unexpectedGuestPlay,
      title: 'نسخهٔ شخصی من',
      author: 'کاربر'
    }
    storageMocks.listPlays.mockResolvedValue([userImport])

    const store = usePlaysStore()
    await store.initialize()

    expect(store.plays).toContainEqual(userImport)

    const bundledCopy = store.plays.find((play) =>
      play.title === unexpectedGuestPlay.title && play.author === unexpectedGuestPlay.author
    )
    expect(bundledCopy).toBeDefined()
    expect(bundledCopy?.id).not.toBe(userImport.id)
    expect(bundledCopy?.id.startsWith(`${BUNDLED_ID_PREFIX}collision:`)).toBe(true)

    expect(storageMocks.savePlay).not.toHaveBeenCalledWith(expect.objectContaining({
      id: userImport.id,
      title: unexpectedGuestPlay.title
    }))
  })

  it('reserves canonical bundled IDs against future user imports', async () => {
    storageMocks.listPlays.mockResolvedValue([])
    const store = usePlaysStore()
    await store.initialize()
    storageMocks.savePlay.mockClear()

    await expect(store.importJson(JSON.stringify(yasrebiBundledPlays[0]))).rejects.toThrow('builtin:')
    expect(storageMocks.savePlay).not.toHaveBeenCalled()
  })

  it('rejects future JSON imports that try to use the reserved bundled namespace', async () => {
    storageMocks.listPlays.mockResolvedValue([])
    const store = usePlaysStore()
    await store.initialize()
    storageMocks.savePlay.mockClear()

    await expect(store.importJson(JSON.stringify(unexpectedGuestPlay))).rejects.toThrow('builtin:')
    expect(storageMocks.savePlay).not.toHaveBeenCalled()
  })
})
