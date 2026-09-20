// @vitest-environment jsdom

import { flushPromises, shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ReaderView from '../src/views/ReaderView.vue'

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(async () => undefined),
  updateCharacterColor: vi.fn(async () => undefined),
  push: vi.fn(),
  replace: vi.fn(),
  saveReadingState: vi.fn(async () => undefined),
  saveProofreadingCorrection: vi.fn(async () => undefined),
  clipboardWrite: vi.fn(async () => undefined)
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
      author: 'نویسنده تست',
      translator: 'مترجم تست',
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
  listProofreadingCorrections: vi.fn(async () => []),
  saveNote: vi.fn(async () => undefined),
  saveProofreadingCorrection: mocks.saveProofreadingCorrection,
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

const FocusableCharacterPanelStub = defineComponent({
  name: 'CharacterPanel',
  emits: ['close'],
  template: '<aside><button class="panel-close-button" type="button" @click="$emit(\'close\')">بستن</button></aside>'
})

afterEach(() => {
  document.body.innerHTML = ''
  mocks.saveProofreadingCorrection.mockClear()
  mocks.clipboardWrite.mockClear()
})

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
  it('shows play author, translator, character count, and estimated duration in the header', async () => {
    mockCompactViewport(false)
    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    const metadata = wrapper.get('.reader-play-metadata').text()
    expect(metadata).toContain('نویسنده: نویسنده تست')
    expect(metadata).toContain('مترجم: مترجم تست')
    expect(metadata).toContain('1 شخصیت')
    expect(metadata).toContain('حدود 1 دقیقه')
  })


  it('records a proofreading correction locally and copies its dialogue summary', async () => {
    mockCompactViewport(false)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mocks.clipboardWrite }
    })

    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    const debugButton = wrapper.get('.reader-proofreading-button')
    await debugButton.trigger('click')
    expect(debugButton.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('.proofreading-status').text()).toContain('0 عیب ثبت‌شده')

    const dialogue = wrapper.findComponent({ name: 'DialogueBlockView' })
    expect(dialogue.props('debugMode')).toBe(true)
    dialogue.vm.$emit('proofread', 'سلام')
    await wrapper.vm.$nextTick()

    const editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    expect(editor.exists()).toBe(true)
    expect(editor.props('draft')).toMatchObject({
      label: 'دیالوگ شماره 1',
      originalText: 'سلام'
    })

    editor.vm.$emit('save', 'درود')
    await flushPromises()

    expect(mocks.saveProofreadingCorrection).toHaveBeenCalledTimes(1)
    expect(mocks.saveProofreadingCorrection).toHaveBeenCalledWith(expect.objectContaining({
      playId: 'test-play',
      blockId: 'block-1',
      blockIndex: 1,
      dialogueNumber: 1,
      originalText: 'سلام',
      correctedText: 'درود'
    }))
    expect(mocks.clipboardWrite).toHaveBeenCalledWith(expect.stringContaining('دیالوگ شماره 1'))
    expect(mocks.clipboardWrite).toHaveBeenCalledWith(expect.stringContaining('متن اشتباه: سلام'))
    expect(mocks.clipboardWrite).toHaveBeenCalledWith(expect.stringContaining('متن درست: درود'))
    expect(wrapper.findComponent({ name: 'ProofreadingEditor' }).exists()).toBe(false)
    expect(wrapper.get('.proofreading-status').text()).toContain('1 عیب ثبت‌شده')
  })


  it('ignores duplicate proofreading submissions while persistence is pending', async () => {
    mockCompactViewport(false)
    let resolveSave!: () => void
    mocks.saveProofreadingCorrection.mockImplementationOnce(() => new Promise<void>((resolve) => {
      resolveSave = resolve
    }))

    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const dialogue = wrapper.findComponent({ name: 'DialogueBlockView' })
    dialogue.vm.$emit('proofread', 'سلام')
    await wrapper.vm.$nextTick()

    const editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    editor.vm.$emit('save', 'درود')
    editor.vm.$emit('save', 'درود')
    await wrapper.vm.$nextTick()

    expect(mocks.saveProofreadingCorrection).toHaveBeenCalledTimes(1)
    expect(editor.props('saving')).toBe(true)

    resolveSave()
    await flushPromises()
    expect(wrapper.findComponent({ name: 'ProofreadingEditor' }).exists()).toBe(false)
  })

  it('turns proofreading off before entering table-read mode', async () => {
    mockCompactViewport(false)
    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    await wrapper.get('.reader-proofreading-button').trigger('click')
    expect(wrapper.get('.reader-proofreading-button').attributes('aria-pressed')).toBe('true')

    const toolbar = wrapper.findComponent({ name: 'ReaderToolbar' })
    toolbar.vm.$emit('setMode', 'table-read')
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.reader-proofreading-button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('.proofreading-status').exists()).toBe(false)
    expect(wrapper.find('.table-read').exists()).toBe(true)
  })

  it('turns proofreading off before entering rehearsal mode', async () => {
    mockCompactViewport(false)
    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    await wrapper.get('.reader-proofreading-button').trigger('click')
    expect(wrapper.get('.reader-proofreading-button').attributes('aria-pressed')).toBe('true')

    const toolbar = wrapper.findComponent({ name: 'ReaderToolbar' })
    toolbar.vm.$emit('setMode', 'rehearsal')
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.reader-proofreading-button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('.proofreading-status').exists()).toBe(false)
    expect(wrapper.find('.rehearsal-controls').exists()).toBe(true)
  })

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
    expect(wrapper.get('.reader-roles-button').attributes('aria-label')).toBe('باز کردن نقش‌ها')
  })

  it('moves focus into the roles panel when opened and back to the opener when closed', async () => {
    mockCompactViewport(true)
    const wrapper = shallowMount(ReaderView, {
      attachTo: document.body,
      global: {
        stubs: {
          CharacterPanel: FocusableCharacterPanelStub
        }
      }
    })
    await flushPromises()

    const opener = wrapper.get<HTMLButtonElement>('.reader-roles-button')
    opener.element.focus()
    await opener.trigger('click')
    await wrapper.vm.$nextTick()

    const closeButton = wrapper.get<HTMLButtonElement>('.panel-close-button')
    expect(document.activeElement).toBe(closeButton.element)

    await closeButton.trigger('click')
    await wrapper.vm.$nextTick()

    const restoredOpener = wrapper.get<HTMLButtonElement>('.reader-roles-button')
    expect(document.activeElement).toBe(restoredOpener.element)

    wrapper.unmount()
  })

  it('starts with the roles panel collapsed on compact/mobile viewports', async () => {
    mockCompactViewport(true)
    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    expect(wrapper.get('main.reader-layout').classes()).toContain('sidebar-closed')
    expect(wrapper.findComponent({ name: 'CharacterPanel' }).exists()).toBe(false)
    expect(wrapper.find('.reader-roles-button').exists()).toBe(true)

    await wrapper.get('.reader-roles-button').trigger('click')
    expect(wrapper.findComponent({ name: 'CharacterPanel' }).exists()).toBe(true)
  })

  it('registers the scroll listener before async initialization and removes it if unmounted early', async () => {
    mockCompactViewport(false)
    let resolveInitialize!: () => void
    mocks.initialize.mockImplementationOnce(() => new Promise<undefined>((resolve) => {
      resolveInitialize = () => resolve(undefined)
    }))
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const wrapper = shallowMount(ReaderView)
    expect(addSpy.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1)

    wrapper.unmount()
    expect(removeSpy.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1)

    resolveInitialize()
    await flushPromises()
    expect(addSpy.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1)

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('shows a lower-left back-to-top control after scrolling and scrolls smoothly to the top', async () => {
    mockCompactViewport(false)
    const scrollTo = vi.fn()
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: scrollTo })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true })

    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    expect(wrapper.find('.back-to-top-button').exists()).toBe(false)

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 700, writable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()

    const button = wrapper.get('.back-to-top-button')
    expect(button.attributes('aria-label')).toBe('برگشت به بالای صفحه')
    await button.trigger('click')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
