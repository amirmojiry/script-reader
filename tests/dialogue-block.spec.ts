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
      revealMode
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
})
