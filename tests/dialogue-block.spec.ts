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
