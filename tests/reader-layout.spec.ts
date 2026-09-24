// @vitest-environment jsdom

import { flushPromises, shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProofreadingCorrection } from '../src/types'
import ReaderView from '../src/views/ReaderView.vue'

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(async () => undefined),
  updateCharacterColor: vi.fn(async () => undefined),
  push: vi.fn(),
  replace: vi.fn(),
  saveReadingState: vi.fn(async () => undefined),
  saveProofreadingCorrection: vi.fn(async () => undefined),
  listProofreadingCorrections: vi.fn(async (): Promise<ProofreadingCorrection[]> => []),
  deleteProofreadingCorrectionsForBlock: vi.fn(async () => undefined),
  replaceProofreadingCorrectionsForBlock: vi.fn(async () => undefined),
  clearProofreadingCorrections: vi.fn(async () => undefined),
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
        blocks: [
          { id: 'block-1', type: 'dialogue', characterId: 'role-1', parts: [{ type: 'speech', text: 'سلام' }] },
          { id: 'block-2', type: 'stage-direction', text: 'نور کم می‌شود.' },
          { id: 'block-3', type: 'section', title: 'بخش بخش' }
        ]
      }, {
        id: 'scene-2',
        title: 'صحنه دوم',
        blocks: [
          { id: 'block-4', type: 'stage-direction', text: 'صحنه دوم تاریک است.' },
          { id: 'block-5', type: 'dialogue', characterId: 'role-1', parts: [{ type: 'speech', text: 'ادامه' }] },
          { id: 'block-6', type: 'stage-direction', text: 'در باز می‌شود.' }
        ]
      }] }]
    } : undefined
  })
}))

vi.mock('../src/services/storage', () => ({
  clearProofreadingCorrections: mocks.clearProofreadingCorrections,
  deleteNote: vi.fn(async () => undefined),
  deleteProofreadingCorrectionsForBlock: mocks.deleteProofreadingCorrectionsForBlock,
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
  listProofreadingCorrections: mocks.listProofreadingCorrections,
  replaceProofreadingCorrectionsForBlock: mocks.replaceProofreadingCorrectionsForBlock,
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

const ProofreadingRevealTextStub = defineComponent({
  name: 'RehearsalRevealText',
  props: {
    text: { type: String, required: true }
  },
  template: '<span class="narrator-rehearsal-text">{{ text }}</span>'
})

afterEach(() => {
  document.body.innerHTML = ''
  mocks.saveProofreadingCorrection.mockReset()
  mocks.saveProofreadingCorrection.mockResolvedValue(undefined)
  mocks.listProofreadingCorrections.mockReset()
  mocks.listProofreadingCorrections.mockResolvedValue([])
  mocks.deleteProofreadingCorrectionsForBlock.mockClear()
  mocks.replaceProofreadingCorrectionsForBlock.mockReset()
  mocks.replaceProofreadingCorrectionsForBlock.mockResolvedValue(undefined)
  mocks.clearProofreadingCorrections.mockClear()
  mocks.clipboardWrite.mockClear()
  vi.unstubAllGlobals()
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true })
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
  it('keeps the full title and actions visible while hiding metadata after scrolling', async () => {
    mockCompactViewport(false)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true })
    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    const header = wrapper.get('.reader-header')
    const children = Array.from(header.element.children)
    const titleBlockIndex = children.findIndex((element) => element.classList.contains('reader-title-block'))
    const actionsIndex = children.findIndex((element) => element.classList.contains('reader-primary-actions'))
    expect(actionsIndex).toBeGreaterThan(titleBlockIndex)
    expect(wrapper.get('.reader-title-block h1').text()).toBe('نمایش تست')
    expect(wrapper.get('.reader-play-metadata').attributes('style') ?? '').not.toContain('display: none')

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 32, writable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.reader-title-block h1').text()).toBe('نمایش تست')
    expect(wrapper.find('.reader-primary-actions').exists()).toBe(true)
    expect(wrapper.get('.reader-play-metadata').attributes('style')).toContain('display: none')
  })

  it('shrinks a long title to fit before falling back to wrapping', async () => {
    mockCompactViewport(false)
    const resizeCallbacks: ResizeObserverCallback[] = []
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    })

    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    const title = wrapper.get<HTMLHeadingElement>('.reader-title-block h1')
    Object.defineProperty(title.element, 'clientWidth', { configurable: true, get: () => 160 })
    Object.defineProperty(title.element, 'scrollWidth', {
      configurable: true,
      get: () => 200 * (Number.parseFloat(title.element.style.fontSize || '28') / 28)
    })

    for (const callback of resizeCallbacks) callback([], {} as ResizeObserver)
    await flushPromises()

    expect(title.element.style.fontSize).toBe('22px')
    expect(title.classes()).not.toContain('reader-title-wrap')
  })

  it('refits the title after web fonts finish loading', async () => {
    mockCompactViewport(false)

    let resolveFonts!: () => void
    const fontsReady = new Promise<void>((resolve) => {
      resolveFonts = resolve
    })
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: fontsReady }
    })

    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    const title = wrapper.get<HTMLHeadingElement>('.reader-title-block h1')
    let requiredWidth = 150
    Object.defineProperty(title.element, 'clientWidth', { configurable: true, get: () => 150 })
    Object.defineProperty(title.element, 'scrollWidth', {
      configurable: true,
      get: () => requiredWidth * (Number.parseFloat(title.element.style.fontSize || '28') / 28)
    })

    expect(title.element.style.fontSize).toBe('28px')
    requiredWidth = 210
    resolveFonts()
    await flushPromises()

    expect(title.element.style.fontSize).toBe('20px')
  })

  it('publishes the sticky reader header height for the proofreading status offset', async () => {
    mockCompactViewport(false)
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return this.classList?.contains('reader-header') ? 88 : 0
      }
    })

    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    expect(wrapper.get('main.reader-layout').attributes('style')).toContain('--reader-header-height: 88px')

    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', descriptor)
    else delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight
  })

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

    editor.vm.$emit('save', 'درود', 1)
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
    const nextEditor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    expect(nextEditor.exists()).toBe(true)
    expect(nextEditor.props('draft')).toMatchObject({
      label: 'توضیح صحنه، بخش 2',
      text: 'نور کم می‌شود.'
    })
    expect(wrapper.get('.proofreading-status').text()).toContain('1 عیب ثبت‌شده')
  })


  it('does not replace a dirty draft with its uncommitted live preview', async () => {
    mockCompactViewport(false)
    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const dialogue = wrapper.findComponent({ name: 'DialogueBlockView' })
    dialogue.vm.$emit('proofread', 'سلام', 0)
    await wrapper.vm.$nextTick()

    let editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    editor.vm.$emit('preview', 'درود')
    await wrapper.vm.$nextTick()

    wrapper.findComponent({ name: 'DialogueBlockView' }).vm.$emit('proofread', 'درود', 0)
    await wrapper.vm.$nextTick()

    editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    expect(editor.props('draft')).toMatchObject({
      sourceBlockText: 'سلام',
      originalText: 'سلام',
      text: 'درود'
    })

    editor.vm.$emit('save', 'سلام تازه', 1)
    await flushPromises()

    expect(mocks.saveProofreadingCorrection).toHaveBeenCalledWith(expect.objectContaining({
      blockId: 'block-1',
      originalOffset: 0,
      sourceBlockText: 'سلام',
      originalText: 'سلام',
      correctedText: 'سلام تازه'
    }))
  })

  it('stores the effective block text as the snapshot for a chained edit', async () => {
    mockCompactViewport(false)
    mocks.listProofreadingCorrections.mockResolvedValueOnce([{
      id: 'correction-1',
      playId: 'test-play',
      playTitle: 'نمایش تست',
      blockId: 'block-1',
      blockIndex: 1,
      blockType: 'dialogue',
      dialogueNumber: 1,
      originalOffset: 0,
      sourceBlockText: 'سلام',
      originalText: 'سلام',
      correctedText: 'درود',
      createdAt: '2026-09-21T08:00:00.000Z'
    }])

    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const dialogue = wrapper.findComponent({ name: 'DialogueBlockView' })
    dialogue.vm.$emit('proofread', 'درود', 0)
    await wrapper.vm.$nextTick()

    const editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    editor.vm.$emit('save', 'درود!', 1)
    await flushPromises()

    expect(mocks.saveProofreadingCorrection).toHaveBeenCalledWith(expect.objectContaining({
      blockId: 'block-1',
      originalOffset: 0,
      sourceBlockText: 'درود',
      originalText: 'درود',
      correctedText: 'درود!'
    }))
  })

  it('persists an intentional empty replacement and then navigates', async () => {
    mockCompactViewport(false)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mocks.clipboardWrite }
    })

    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const dialogue = wrapper.findComponent({ name: 'DialogueBlockView' })
    dialogue.vm.$emit('proofread', 'سلام', 0)
    await wrapper.vm.$nextTick()

    const editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    editor.vm.$emit('save', '', 1)
    await flushPromises()

    expect(mocks.saveProofreadingCorrection).toHaveBeenCalledWith(expect.objectContaining({
      blockId: 'block-1',
      originalOffset: 0,
      originalText: 'سلام',
      correctedText: ''
    }))
    expect(wrapper.findComponent({ name: 'ProofreadingEditor' }).props('draft')).toMatchObject({
      label: 'توضیح صحنه، بخش 2'
    })
  })

  it('reopens and edits a fully deleted block', async () => {
    mockCompactViewport(false)
    mocks.listProofreadingCorrections.mockResolvedValueOnce([{
      id: 'delete-stage',
      playId: 'test-play',
      playTitle: 'نمایش تست',
      blockId: 'block-2',
      blockIndex: 2,
      blockType: 'stage-direction',
      originalOffset: 0,
      originalText: 'نور کم می‌شود.',
      correctedText: '',
      createdAt: '2026-09-21T08:00:00.000Z'
    }])

    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const stage = wrapper.get('#block-block-2')
    await stage.trigger('click')
    await wrapper.vm.$nextTick()

    const editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    expect(editor.exists()).toBe(true)
    expect(editor.props('draft')).toMatchObject({
      label: 'توضیح صحنه، بخش 2',
      originalText: '',
      text: ''
    })
    expect(editor.props('canRevert')).toBe(true)

    editor.vm.$emit('preview', 'نور دوباره روشن می‌شود.')
    await wrapper.vm.$nextTick()
    expect(wrapper.get('#block-block-2').text()).toContain('نور دوباره روشن می‌شود.')

    wrapper.findComponent({ name: 'ProofreadingEditor' }).vm.$emit('save', 'نور دوباره روشن می‌شود.', 1)
    await flushPromises()

    expect(mocks.replaceProofreadingCorrectionsForBlock).toHaveBeenCalledWith(
      'test-play',
      'block-2',
      expect.objectContaining({
        blockId: 'block-2',
        originalOffset: 0,
        originalText: 'نور کم می‌شود.',
        correctedText: 'نور دوباره روشن می‌شود.'
      })
    )
    expect(mocks.deleteProofreadingCorrectionsForBlock).not.toHaveBeenCalled()
    expect(mocks.saveProofreadingCorrection).not.toHaveBeenCalled()
  })

  it('keeps the existing deletion when atomic replacement persistence fails', async () => {
    mockCompactViewport(false)
    mocks.listProofreadingCorrections.mockResolvedValueOnce([{
      id: 'delete-stage',
      playId: 'test-play',
      playTitle: 'نمایش تست',
      blockId: 'block-2',
      blockIndex: 2,
      blockType: 'stage-direction',
      originalOffset: 0,
      sourceBlockText: 'نور کم می‌شود.',
      originalText: 'نور کم می‌شود.',
      correctedText: '',
      createdAt: '2026-09-21T08:00:00.000Z'
    }])
    mocks.replaceProofreadingCorrectionsForBlock.mockRejectedValueOnce(new Error('quota'))

    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const stage = wrapper.get('#block-block-2')
    await stage.trigger('click')
    await wrapper.vm.$nextTick()

    wrapper.findComponent({ name: 'ProofreadingEditor' }).vm.$emit('save', 'نور دوباره روشن می‌شود.', 1)
    await flushPromises()

    expect(mocks.replaceProofreadingCorrectionsForBlock).toHaveBeenCalledTimes(1)
    expect(wrapper.get('.proofreading-status').text()).toContain('1 عیب ثبت‌شده')
    expect(wrapper.get('#block-block-2').text()).not.toContain('نور دوباره روشن می‌شود.')
  })

  it('previews edited text in the play and can revert the current block to source', async () => {
    mockCompactViewport(false)
    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const dialogue = wrapper.findComponent({ name: 'DialogueBlockView' })
    dialogue.vm.$emit('proofread', 'سلام')
    await wrapper.vm.$nextTick()

    const editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    editor.vm.$emit('preview', 'درود')
    await wrapper.vm.$nextTick()

    const previewedDialogue = wrapper.findComponent({ name: 'DialogueBlockView' })
    const previewSegments = previewedDialogue.props('proofreadingSegments') as Array<{ text: string; changed: boolean }>
    expect(previewSegments.map((segment) => segment.text).join('')).toBe('درود')
    expect(previewSegments.some((segment) => segment.changed)).toBe(true)
    expect(wrapper.findComponent({ name: 'ProofreadingEditor' }).props('canRevert')).toBe(true)

    wrapper.findComponent({ name: 'ProofreadingEditor' }).vm.$emit('revert')
    await flushPromises()

    expect(mocks.replaceProofreadingCorrectionsForBlock).toHaveBeenCalledWith('test-play', 'block-1')
    expect(mocks.deleteProofreadingCorrectionsForBlock).not.toHaveBeenCalled()
    expect(wrapper.findComponent({ name: 'DialogueBlockView' }).props('proofreadingSegments')).toBeUndefined()
    expect(wrapper.findComponent({ name: 'ProofreadingEditor' }).props('draft')).toMatchObject({
      text: 'سلام',
      originalText: 'سلام'
    })
  })

  it('guards a block revert against concurrent saves while persistence is pending', async () => {
    mockCompactViewport(false)
    mocks.listProofreadingCorrections.mockResolvedValueOnce([{
      id: 'correction-1',
      playId: 'test-play',
      playTitle: 'نمایش تست',
      blockId: 'block-1',
      blockIndex: 1,
      blockType: 'dialogue',
      dialogueNumber: 1,
      originalOffset: 0,
      sourceBlockText: 'سلام',
      originalText: 'سلام',
      correctedText: 'درود',
      createdAt: '2026-09-21T09:00:00.000Z'
    }])

    let resolveRevert!: () => void
    mocks.replaceProofreadingCorrectionsForBlock.mockImplementationOnce(
      () => new Promise<undefined>((resolve) => {
        resolveRevert = () => resolve(undefined)
      })
    )

    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const dialogue = wrapper.findComponent({ name: 'DialogueBlockView' })
    dialogue.vm.$emit('proofread', 'درود', 0)
    await wrapper.vm.$nextTick()

    const editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    editor.vm.$emit('revert')
    await wrapper.vm.$nextTick()

    expect(mocks.replaceProofreadingCorrectionsForBlock).toHaveBeenCalledTimes(1)
    expect(editor.props('saving')).toBe(true)

    editor.vm.$emit('save', 'متن تازه', 1)
    await wrapper.vm.$nextTick()
    expect(mocks.saveProofreadingCorrection).not.toHaveBeenCalled()
    expect(mocks.replaceProofreadingCorrectionsForBlock).toHaveBeenCalledTimes(1)

    resolveRevert()
    await flushPromises()

    expect(wrapper.get('.proofreading-status').text()).toContain('0 عیب ثبت‌شده')
    expect(wrapper.findComponent({ name: 'ProofreadingEditor' }).props('draft')).toMatchObject({
      text: 'سلام',
      originalText: 'سلام'
    })
  })

  it('confirms and clears every local proofreading correction for the play', async () => {
    mockCompactViewport(false)
    mocks.listProofreadingCorrections.mockResolvedValueOnce([{
      id: 'correction-1',
      playId: 'test-play',
      playTitle: 'نمایش تست',
      blockId: 'block-1',
      blockIndex: 1,
      blockType: 'dialogue',
      dialogueNumber: 1,
      originalText: 'سلام',
      correctedText: 'درود',
      createdAt: '2026-09-21T06:00:00.000Z'
    }])
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    expect(wrapper.get('.proofreading-status').text()).toContain('1 عیب ثبت‌شده')
    expect(wrapper.findComponent({ name: 'DialogueBlockView' }).props('proofreadingSegments')).toBeTruthy()

    await wrapper.get('.proofreading-status .danger-button').trigger('click')
    await flushPromises()

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(mocks.clearProofreadingCorrections).toHaveBeenCalledWith('test-play')
    expect(wrapper.get('.proofreading-status').text()).toContain('0 عیب ثبت‌شده')
    expect(wrapper.findComponent({ name: 'DialogueBlockView' }).props('proofreadingSegments')).toBeUndefined()
    confirmSpy.mockRestore()
  })

  it('ignores duplicate proofreading submissions while persistence is pending and starts clipboard copy immediately', async () => {
    mockCompactViewport(false)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mocks.clipboardWrite }
    })
    let resolveSave!: () => void
    mocks.saveProofreadingCorrection.mockImplementationOnce(() => new Promise<undefined>((resolve) => {
      resolveSave = () => resolve(undefined)
    }))

    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const dialogue = wrapper.findComponent({ name: 'DialogueBlockView' })
    dialogue.vm.$emit('proofread', 'سلام')
    await wrapper.vm.$nextTick()

    const editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    editor.vm.$emit('save', 'درود', 1)
    editor.vm.$emit('save', 'درود', 1)
    await wrapper.vm.$nextTick()

    expect(mocks.saveProofreadingCorrection).toHaveBeenCalledTimes(1)
    expect(mocks.clipboardWrite).toHaveBeenCalledTimes(1)
    expect(mocks.clipboardWrite).toHaveBeenCalledWith(expect.stringContaining('متن درست: درود'))
    expect(editor.props('saving')).toBe(true)

    dialogue.vm.$emit('proofread', 'متن دوم')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'ProofreadingEditor' }).props('draft')).toMatchObject({
      originalText: 'سلام'
    })

    resolveSave()
    await flushPromises()
    expect(wrapper.findComponent({ name: 'ProofreadingEditor' }).props('draft')).toMatchObject({
      label: 'توضیح صحنه، بخش 2'
    })
  })

  it('captures stage-direction source text without the narrator UI label', async () => {
    mockCompactViewport(false)
    const wrapper = shallowMount(ReaderView, {
      attachTo: document.body,
      global: {
        stubs: {
          RehearsalRevealText: ProofreadingRevealTextStub
        }
      }
    })
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const stage = wrapper.get('#block-block-2')
    const selection = window.getSelection()
    expect(selection).not.toBeNull()
    if (!selection) throw new Error('Selection API unavailable')

    const labelText = stage.get('.narrator-label').element.firstChild
    expect(labelText).not.toBeNull()
    if (!labelText) throw new Error('Narrator label missing')
    const labelRange = document.createRange()
    labelRange.selectNodeContents(labelText)
    selection.removeAllRanges()
    selection.addRange(labelRange)
    await stage.trigger('mouseup')
    expect(wrapper.findComponent({ name: 'ProofreadingEditor' }).exists()).toBe(false)

    const sourceText = stage.get('.narrator-rehearsal-text').element.firstChild
    expect(sourceText).not.toBeNull()
    if (!sourceText) throw new Error('Stage source text missing')
    const sourceRange = document.createRange()
    sourceRange.selectNodeContents(sourceText)
    selection.removeAllRanges()
    selection.addRange(sourceRange)
    await stage.trigger('mouseup')
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'ProofreadingEditor' }).props('draft')).toMatchObject({
      originalText: 'نور کم می‌شود.'
    })

    selection.removeAllRanges()
    wrapper.unmount()
  })

  it('restores focus to the proofreading trigger after canceling the editor', async () => {
    mockCompactViewport(false)
    const wrapper = shallowMount(ReaderView, { attachTo: document.body })
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const section = wrapper.get<HTMLHeadingElement>('#block-block-3')
    section.element.focus()
    await section.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()

    const editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    expect(editor.exists()).toBe(true)
    editor.vm.$emit('cancel')
    await flushPromises()

    expect(document.activeElement).toBe(section.element)
    wrapper.unmount()
  })

  it('reopens a boundary block from persisted text without reapplying the completed preview', async () => {
    mockCompactViewport(false)
    const wrapper = shallowMount(ReaderView, { attachTo: document.body })
    await flushPromises()
    await wrapper.get('.reader-proofreading-button').trigger('click')

    const section = wrapper.get<HTMLHeadingElement>('#block-block-3')
    Object.defineProperty(section.element, 'scrollIntoView', {
      configurable: true,
      value: vi.fn()
    })
    const walker = document.createTreeWalker(section.element, NodeFilter.SHOW_TEXT)
    let textNode: Node | null = walker.nextNode()
    while (textNode && !textNode.textContent?.includes('بخش')) textNode = walker.nextNode()
    expect(textNode).not.toBeNull()
    if (!textNode?.textContent) throw new Error('Section text missing')
    const start = textNode.textContent.indexOf('بخش')

    const range = document.createRange()
    range.setStart(textNode, start)
    range.setEnd(textNode, start + 3)
    const selection = window.getSelection()
    expect(selection).not.toBeNull()
    if (!selection) throw new Error('Selection API unavailable')
    selection.removeAllRanges()
    selection.addRange(range)

    await section.trigger('mouseup')
    await wrapper.vm.$nextTick()
    selection.removeAllRanges()

    const editor = wrapper.findComponent({ name: 'ProofreadingEditor' })
    expect(editor.props('draft')).toMatchObject({
      originalText: 'بخش',
      text: 'بخش'
    })

    editor.vm.$emit('save', 'قسمت', 1)
    await flushPromises()

    expect(mocks.saveProofreadingCorrection).toHaveBeenCalledWith(expect.objectContaining({
      blockId: 'block-3',
      originalOffset: 0,
      originalText: 'بخش',
      correctedText: 'قسمت'
    }))
    expect(wrapper.findComponent({ name: 'ProofreadingEditor' }).props('draft')).toMatchObject({
      originalText: 'قسمت بخش',
      text: 'قسمت بخش'
    })

    wrapper.unmount()
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

  it('shows scene headings as structural reader labels without adding spoken blocks', async () => {
    mockCompactViewport(false)
    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    const heading = wrapper.get('.reader-scene-heading')
    expect(heading.text()).toContain('صحنه')
    expect(heading.text()).not.toContain('پرده')
    expect(wrapper.findAllComponents({ name: 'DialogueBlockView' })).toHaveLength(2)
  })

  it('keeps scene headings attached to the first visible cue-only entry in each represented scene', async () => {
    mockCompactViewport(false)
    const wrapper = shallowMount(ReaderView)
    await flushPromises()

    await wrapper.get('#block-block-6').trigger('click')
    const roles = wrapper.findComponent({ name: 'CharacterPanel' })
    roles.vm.$emit('chooseNarratorMine')
    await flushPromises()

    const toolbar = wrapper.findComponent({ name: 'ReaderToolbar' })
    toolbar.vm.$emit('setMode', 'rehearsal')
    await wrapper.vm.$nextTick()
    toolbar.vm.$emit('updateSettings', {
      ...(toolbar.props('settings') as Record<string, unknown>),
      rehearsalCueOnly: true
    })
    await flushPromises()

    const headings = wrapper.findAll('.reader-scene-heading')
    expect(headings).toHaveLength(1)
    expect(headings[0].text()).toContain('صحنه دوم')
    expect(wrapper.find('#block-block-4').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'DialogueBlockView' }).props('block')).toMatchObject({ id: 'block-5' })
  })

  it('toggles reader panels from the sticky header and auto-collapses scene navigation after scrolling', async () => {
    mockCompactViewport(false)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true })
    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    expect(wrapper.get('.reader-scene-nav-button').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('.scene-nav').attributes('style') ?? '').not.toContain('display: none')

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 32, writable: true })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.reader-scene-nav-button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('.reader-line-tools-button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('.reader-toolbar-button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('.scene-nav').attributes('style')).toContain('display: none')

    await wrapper.get('.reader-scene-nav-button').trigger('click')
    expect(wrapper.get('.reader-scene-nav-button').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('.scene-nav').classes()).toContain('reader-floating-panel')
    await wrapper.get('.reader-line-tools-button').trigger('click')
    expect(wrapper.get('.reader-scene-nav-button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('.reader-line-tools-button').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('.line-tools').classes()).toContain('reader-floating-panel')
    await wrapper.get('.reader-toolbar-button').trigger('click')
    expect(wrapper.get('.reader-line-tools-button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('.reader-toolbar-button').attributes('aria-pressed')).toBe('true')
    expect(wrapper.findComponent({ name: 'ReaderToolbar' }).classes()).toContain('reader-floating-panel')
  })

  it('closes scene navigation after jumping to a scene', async () => {
    mockCompactViewport(false)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true })
    const wrapper = shallowMount(ReaderView)
    await flushPromises()
    await wrapper.get('.scene-nav button').trigger('click')
    await flushPromises()
    expect(wrapper.get('.reader-scene-nav-button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('.scene-nav').attributes('style')).toContain('display: none')
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
