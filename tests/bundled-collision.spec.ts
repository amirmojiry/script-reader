import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BUNDLED_ID_PREFIX } from '../src/data/bundledPlays'
import { unexpectedGuestPlay } from '../src/data/unexpectedGuest'
import { usePlaysStore } from '../src/stores/plays'
import type { Play } from '../src/types'

const storageMocks = vi.hoisted(() => ({
  listPlays: vi.fn(),
  savePlay: vi.fn(),
  deletePlay: vi.fn()
}))

vi.mock('../src/services/storage', () => ({
  listPlays: storageMocks.listPlays,
  savePlay: storageMocks.savePlay,
  deletePlay: storageMocks.deletePlay
}))

describe('bundled play ID collisions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    storageMocks.listPlays.mockReset()
    storageMocks.savePlay.mockReset()
    storageMocks.deletePlay.mockReset()
    storageMocks.savePlay.mockResolvedValue(undefined)
    storageMocks.deletePlay.mockResolvedValue(undefined)
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

  it('rejects future JSON imports that try to use the reserved bundled namespace', async () => {
    storageMocks.listPlays.mockResolvedValue([])
    const store = usePlaysStore()
    await store.initialize()
    storageMocks.savePlay.mockClear()

    await expect(store.importJson(JSON.stringify(unexpectedGuestPlay))).rejects.toThrow('builtin:')
    expect(storageMocks.savePlay).not.toHaveBeenCalled()
  })
})
