// @vitest-environment jsdom

import { flushPromises, shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ReaderView from '../src/views/ReaderView.vue'

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(async () => undefined),
  updateCharacterColor: vi.fn(async () => undefined),
  push: vi.fn(),
  replace: vi.fn(),
  saveReadingState: vi.fn(async () => undefined)
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'test-play' } }),
  useRouter: () => ({ push: mocks.push, replace: mocks.replace })
}))

vi.mock('../src/stores/plays', () => ({
  usePlaysStore: () => ({
    initialize: mocks.initialize,
    updateCharacterColor: mocks.updateCharacterColor,
    byId: (id: string) => id === 'test-play' ? {
      id: 'test-play',
      title: 'نمایش تست',
      genres: ['درام'],
      characters: [{ id: 'role-1', name: 'نقش یک', gender: 'unknown' }],
      acts: [{ id: 'act-1', title: 'پرده', scenes: [{
        id: 'scene-1',
        title: 'صحنه',
        blocks: [{ id: 'block-1', type: 'dialogue', characterId: 'role-1', parts: [{ type: 'speech', text: 'سلام' }] }]
      }] }]
    } : undefined
  })
}))

vi.mock('../src/services/storage', () => ({
  deleteNote: vi.fn(async () => undefined),
  getReadingState: vi.fn(async () => undefined),
  getSettings: vi.fn(async () => ({
    fontSize: 18,
    lineHeight: 1.9,
    font: 'vazirmatn',
    theme: 'light',
    hideStageDirections: false,
    keepAwake: false,
    rehearsalRevealMode: 'hidden',
    rehearsalCueOnly: false
  })),
  listBookmarks: vi.fn(async () => []),
  listNotes: vi.fn(async () => []),
  saveNote: vi.fn(async () => undefined),
  saveReadingState: mocks.saveReadingState,
  saveSettings: vi.fn(async () => undefined),
  toggleBookmark: vi.fn(async () => undefined)
}))

vi.mock('../src/services/speech', () => ({
  canSpeak: () => false,
  speak: vi.fn(async () => undefined),
  stopSpeaking: vi.fn()
}))

vi.mock('../src/services/wakeLock', () => ({
  releaseWakeLock: vi.fn(async () => undefined),
  requestWakeLock: vi.fn(async () => undefined),
  wakeLockSupported: () => false
}))

function mockCompactViewport(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(max-width: 980px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })
}

describe('reader roles layout', () => {
  it('keeps roles open by default on desktop and expands fully when closed', async () => {
    mockCompactViewport(false)
    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    const main = wrapper.get('main.reader-layout')
    expect(main.classes()).not.toContain('sidebar-closed')
    const panel = wrapper.findComponent({ name: 'CharacterPanel' })
    expect(panel.exists()).toBe(true)

    panel.vm.$emit('chooseNarratorMine')
    await flushPromises()
    expect(mocks.saveReadingState).toHaveBeenLastCalledWith(expect.objectContaining({
      narratorIsMine: true,
      narratorSelected: true,
      myCharacterId: undefined
    }))

    panel.vm.$emit('close')
    await wrapper.vm.$nextTick()

    expect(main.classes()).toContain('sidebar-closed')
    expect(wrapper.findComponent({ name: 'CharacterPanel' }).exists()).toBe(false)
    expect(wrapper.get('.roles-open-button').text()).toBe('نقش‌ها')
  })

  it('starts with the roles panel collapsed on compact/mobile viewports', async () => {
    mockCompactViewport(true)
    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    expect(wrapper.get('main.reader-layout').classes()).toContain('sidebar-closed')
    expect(wrapper.findComponent({ name: 'CharacterPanel' }).exists()).toBe(false)
    expect(wrapper.find('.roles-open-button').exists()).toBe(true)

    await wrapper.get('.roles-open-button').trigger('click')
    expect(wrapper.findComponent({ name: 'CharacterPanel' }).exists()).toBe(true)
  })
})
