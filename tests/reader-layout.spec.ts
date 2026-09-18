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
      characters: [{ id: 'role-1', name: 'نقش یک' }],
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

describe('collapsed reader layout', () => {
  it('activates the collapsed layout state and removes the roles panel', async () => {
    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    const main = wrapper.get('main.reader-layout')
    expect(main.classes()).not.toContain('sidebar-closed')
    expect(wrapper.findComponent({ name: 'CharacterPanel' }).exists()).toBe(true)

    await wrapper.get('.sidebar-toggle').trigger('click')

    expect(main.classes()).toContain('sidebar-closed')
    expect(wrapper.findComponent({ name: 'CharacterPanel' }).exists()).toBe(false)
  })
})
