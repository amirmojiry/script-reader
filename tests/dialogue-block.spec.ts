// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DialogueBlock from '../src/components/DialogueBlock.vue'

const block = {
  id: 'line-1',
  type: 'dialogue' as const,
  characterId: 'mother',
  parts: [
    { type: 'speech' as const, text: 'صبر کن و چند لحظه همین جا بمان.' },
    { type: 'direction' as const, text: 'آرام' },
    { type: 'speech' as const, text: 'بعد برگرد.' }
  ]
}

function mountOwn(revealMode: 'hidden' | 'first-words' | 'progressive') {
  return mount(DialogueBlock, {
    props: {
      block,
      character: { id: 'mother', name: 'مادر' },
      mode: 'rehearsal',
      isMine: true,
      highlighted: false,
      current: false,
      revealMode,
      narratorHighlighted: false,
      narratorIsMine: false,
      narratorColor: '#ddd6fe'
    }
  })
}

describe('DialogueBlock rehearsal', () => {
  it('hides own line until reveal', async () => {
    const wrapper = mountOwn('hidden')
    expect(wrapper.text()).not.toContain('صبر کن')
    await wrapper.get('.hidden-line').trigger('click')
    expect(wrapper.text()).toContain('صبر کن')
    expect(wrapper.text()).toContain('(آرام)')
  })

  it('can show only the first words before full reveal', async () => {
    const wrapper = mountOwn('first-words')
    expect(wrapper.text()).toContain('صبر کن و')
    expect(wrapper.text()).not.toContain('بعد برگرد')
    await wrapper.get('.rehearsal-hint button').trigger('click')
    expect(wrapper.text()).toContain('بعد برگرد')
  })

  it('reveals progressive chunks without exposing directions early', async () => {
    const wrapper = mountOwn('progressive')
    expect(wrapper.text()).toContain('صبر کن و چند لحظه')
    expect(wrapper.text()).not.toContain('(آرام)')
    await wrapper.get('.rehearsal-hint button').trigger('click')
    expect(wrapper.text().length).toBeGreaterThan(20)
  })

  it('shows narrator content during hidden actor rehearsal only when narrator is active', () => {
    const wrapper = mount(DialogueBlock, {
      props: {
        block,
        character: { id: 'mother', name: 'مادر' },
        mode: 'rehearsal',
        isMine: true,
        highlighted: false,
        current: false,
        revealMode: 'hidden',
        narratorHighlighted: true,
        narratorIsMine: false,
        narratorColor: '#ddd6fe'
      }
    })

    expect(wrapper.text()).toContain('(آرام)')
    expect(wrapper.text()).not.toContain('صبر کن')
  })

  it('hides narrator-owned inline text during narrator rehearsal until revealed', async () => {
    const wrapper = mount(DialogueBlock, {
      props: {
        block,
        character: { id: 'mother', name: 'مادر' },
        mode: 'rehearsal',
        isMine: false,
        highlighted: false,
        current: false,
        revealMode: 'hidden',
        narratorHighlighted: true,
        narratorIsMine: true,
        narratorColor: '#ddd6fe'
      }
    })

    expect(wrapper.text()).toContain('صبر کن')
    expect(wrapper.text()).not.toContain('(آرام)')
    await wrapper.get('.narrator-reveal-button').trigger('click')
    expect(wrapper.text()).toContain('(آرام)')
  })

  it('keeps readable separators between adjacent speech and narrator segments', () => {
    const wrapper = mount(DialogueBlock, {
      props: {
        block,
        character: { id: 'mother', name: 'مادر' },
        mode: 'read',
        isMine: false,
        highlighted: false,
        current: false,
        revealMode: 'hidden',
        narratorHighlighted: false,
        narratorIsMine: false,
        narratorColor: '#ddd6fe'
      }
    })

    expect(wrapper.text()).toContain('بمان. (آرام) بعد برگرد.')
  })

  it('highlights narrator-owned inline direction content independently from the character block', () => {
    const wrapper = mount(DialogueBlock, {
      props: {
        block,
        character: { id: 'mother', name: 'مادر' },
        mode: 'read',
        isMine: false,
        highlighted: false,
        current: false,
        revealMode: 'hidden',
        narratorHighlighted: true,
        narratorIsMine: true,
        narratorColor: '#ddd6fe'
      }
    })

    const narrator = wrapper.get('.narrator-segment')
    expect(narrator.text()).toBe('(آرام)')
    expect(narrator.classes()).toContain('narrator-highlighted')
    expect(narrator.classes()).toContain('narrator-mine')
    expect(wrapper.text()).toContain('راوی من')
  })
})


describe('DialogueBlock joint-role highlighting', () => {
  it('uses the selected joint participant color', () => {
    const jointBlock = {
      id: 'joint-line',
      type: 'dialogue' as const,
      characterId: 'simmias',
      characterIds: ['simmias', 'agathon'],
      parts: [{ type: 'speech' as const, text: 'با هم.' }]
    }

    const wrapper = mount(DialogueBlock, {
      props: {
        block: jointBlock,
        characters: [
          { id: 'simmias', name: 'سیمیاس', color: '#111111' },
          { id: 'agathon', name: 'آگاتن', color: '#222222' }
        ],
        mode: 'read',
        isMine: false,
        highlighted: true,
        highlightColor: '#222222',
        current: false,
        revealMode: 'hidden',
        narratorHighlighted: false,
        narratorIsMine: false,
        narratorColor: '#ddd6fe'
      }
    })

    expect(wrapper.text()).toContain('سیمیاس و آگاتن')
    expect(wrapper.get('.dialogue-block').attributes('style')).toContain('--highlight: #222222')
  })
})


describe('DialogueBlock proofreading mode', () => {
  it('ignores UI/header selections and captures only dialogue source text', async () => {
    const wrapper = mount(DialogueBlock, {
      attachTo: document.body,
      props: {
        block,
        character: { id: 'mother', name: 'مادر' },
        mode: 'read',
        isMine: true,
        highlighted: false,
        current: false,
        revealMode: 'hidden',
        narratorHighlighted: false,
        narratorIsMine: false,
        narratorColor: '#ddd6fe',
        debugMode: true
      }
    })

    const selection = window.getSelection()
    expect(selection).not.toBeNull()
    if (!selection) throw new Error('Selection API unavailable')

    const headerText = wrapper.get('header strong').element.firstChild
    expect(headerText).not.toBeNull()
    if (!headerText) throw new Error('Header text missing')
    const headerRange = document.createRange()
    headerRange.selectNodeContents(headerText)
    selection.removeAllRanges()
    selection.addRange(headerRange)
    await wrapper.get('.dialogue-block').trigger('mouseup')
    expect(wrapper.emitted('proofread')).toBeUndefined()

    const speechText = wrapper.get('.dialogue-copy span').element.firstChild
    expect(speechText).not.toBeNull()
    if (!speechText) throw new Error('Dialogue text missing')
    const speechRange = document.createRange()
    speechRange.setStart(speechText, 0)
    speechRange.setEnd(speechText, 4)
    selection.removeAllRanges()
    selection.addRange(speechRange)
    await wrapper.get('.dialogue-block').trigger('mouseup')
    expect(wrapper.emitted('proofread')?.[0]?.[0]).toBe('صبر')

    selection.removeAllRanges()
    wrapper.unmount()
  })

  it('reports the selected occurrence offset for repeated text', async () => {
    const repeatedBlock = {
      id: 'repeat',
      type: 'dialogue' as const,
      characterId: 'mother',
      parts: [{ type: 'speech' as const, text: 'بله بله بله' }]
    }
    const wrapper = mount(DialogueBlock, {
      attachTo: document.body,
      props: {
        block: repeatedBlock,
        character: { id: 'mother', name: 'مادر' },
        mode: 'read',
        isMine: true,
        highlighted: false,
        current: false,
        revealMode: 'hidden',
        narratorHighlighted: false,
        narratorIsMine: false,
        narratorColor: '#ddd6fe',
        debugMode: true
      }
    })

    const textNode = wrapper.get('.dialogue-copy span').element.firstChild
    expect(textNode).not.toBeNull()
    if (!textNode) throw new Error('Dialogue text missing')

    const range = document.createRange()
    range.setStart(textNode, 4)
    range.setEnd(textNode, 7)
    const selection = window.getSelection()
    expect(selection).not.toBeNull()
    if (!selection) throw new Error('Selection API unavailable')
    selection.removeAllRanges()
    selection.addRange(range)

    await wrapper.get('.dialogue-block').trigger('mouseup')
    expect(wrapper.emitted('proofread')?.[0]).toEqual(['بله', 4])

    selection.removeAllRanges()
    wrapper.unmount()
  })

  it('renders effective proofreading text with changed fragments highlighted', async () => {
    const wrapper = mount(DialogueBlock, {
      props: {
        block,
        character: { id: 'mother', name: 'مادر' },
        mode: 'read',
        isMine: true,
        highlighted: false,
        current: false,
        revealMode: 'hidden',
        narratorHighlighted: false,
        narratorIsMine: false,
        narratorColor: '#ddd6fe',
        debugMode: true,
        proofreadingSegments: [
          { text: 'صبر کن و چند لحظه ', changed: false },
          { text: 'اینجا', changed: true },
          { text: ' بمان.', changed: false }
        ]
      }
    })

    expect(wrapper.get('.dialogue-copy').text()).toBe('صبر کن و چند لحظه اینجا بمان.')
    expect(wrapper.get('.proofreading-change').text()).toBe('اینجا')

    await wrapper.get('.dialogue-block').trigger('click')
    expect(wrapper.emitted('proofread')?.[0]?.[0]).toBe('صبر کن و چند لحظه اینجا بمان.')
  })

  it('emits intentionally empty effective text for a fully deleted dialogue', async () => {
    const wrapper = mount(DialogueBlock, {
      props: {
        block,
        character: { id: 'mother', name: 'مادر' },
        mode: 'read',
        isMine: true,
        highlighted: false,
        current: false,
        revealMode: 'hidden',
        narratorHighlighted: false,
        narratorIsMine: false,
        narratorColor: '#ddd6fe',
        debugMode: true,
        proofreadingSegments: []
      }
    })

    await wrapper.get('.dialogue-block').trigger('click')
    expect(wrapper.emitted('proofread')?.[0]).toEqual(['', 0])
  })

  it('shows the full line during rehearsal and emits the full block text on click when no selection exists', async () => {
    const wrapper = mount(DialogueBlock, {
      props: {
        block,
        character: { id: 'mother', name: 'مادر' },
        mode: 'rehearsal',
        isMine: true,
        highlighted: false,
        current: false,
        revealMode: 'hidden',
        narratorHighlighted: false,
        narratorIsMine: false,
        narratorColor: '#ddd6fe',
        debugMode: true
      }
    })

    expect(wrapper.text()).toContain('صبر کن')
    expect(wrapper.text()).toContain('(آرام)')
    const target = wrapper.get('.dialogue-block')
    await target.trigger('click')
    expect(wrapper.emitted('proofread')?.[0]?.[0]).toBe('صبر کن و چند لحظه همین جا بمان. (آرام) بعد برگرد.')

    await target.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('proofread')?.[1]?.[0]).toBe('صبر کن و چند لحظه همین جا بمان. (آرام) بعد برگرد.')
    expect(target.attributes('role')).toBe('button')
  })
})
