// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RehearsalRevealText from '../src/components/RehearsalRevealText.vue'

const text = '(خیلی آرام و با تعجب به پنجره نگاه می‌کند)'

function mountReveal(revealMode: 'hidden' | 'first-words' | 'progressive') {
  return mount(RehearsalRevealText, {
    props: { text, active: true, revealMode }
  })
}

describe('RehearsalRevealText', () => {
  it('fully hides narrator text in hidden mode until reveal', async () => {
    const wrapper = mountReveal('hidden')
    expect(wrapper.text()).not.toContain('خیلی آرام')
    await wrapper.get('.narrator-reveal-button').trigger('click')
    expect(wrapper.text()).toContain('پنجره')
  })

  it('shows only the first words in first-words mode', async () => {
    const wrapper = mountReveal('first-words')
    expect(wrapper.text()).toContain('(خیلی آرام و')
    expect(wrapper.text()).not.toContain('پنجره')
    await wrapper.get('.narrator-reveal-button').trigger('click')
    expect(wrapper.text()).toContain('پنجره')
  })

  it('reveals narrator text progressively', async () => {
    const wrapper = mountReveal('progressive')
    expect(wrapper.text()).toContain('(خیلی آرام و با تعجب')
    expect(wrapper.text()).not.toContain('پنجره')
    await wrapper.get('.narrator-reveal-button').trigger('click')
    expect(wrapper.text()).toContain('پنجره')
  })
})
