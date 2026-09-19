// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import PlayFinderWizard from '../src/components/PlayFinderWizard.vue'
import type { Play } from '../src/types'

function makePlay(id: string, title: string, genres: string[], male = 1, female = 1): Play {
  const characters = [
    ...Array.from({ length: male }, (_, index) => ({ id: `${id}-m-${index}`, name: `مرد ${index}`, gender: 'male' as const })),
    ...Array.from({ length: female }, (_, index) => ({ id: `${id}-f-${index}`, name: `زن ${index}`, gender: 'female' as const }))
  ]
  return {
    id,
    title,
    author: 'نویسنده',
    genres,
    characters,
    acts: [{
      id: `${id}-a`,
      title: 'پرده',
      scenes: [{
        id: `${id}-s`,
        title: 'صحنه',
        blocks: characters.map((character, index) => ({
          id: `${id}-d-${index}`,
          type: 'dialogue' as const,
          characterId: character.id,
          parts: [{ type: 'speech' as const, text: 'سلام دنیا' }]
        }))
      }]
    }]
  }
}

const drama = makePlay('drama', 'درام نمونه', ['درام'])
const comedy = makePlay('comedy', 'کمدی نمونه', ['کمدی'])

afterEach(() => {
  document.body.innerHTML = ''
})

describe('PlayFinderWizard', () => {
  it('reveals time, multi-genre controls, and live recommendations below the cast sliders', async () => {
    const wrapper = mount(PlayFinderWizard, {
      props: { plays: [drama, comedy] },
      global: { stubs: { teleport: true } }
    })

    expect(wrapper.text()).toContain('ترکیب گروه')
    expect(wrapper.text()).not.toContain('زمان و ژانر')

    await wrapper.get('.wizard-continue').trigger('click')
    expect(wrapper.text()).toContain('زمان و ژانر')
    expect(wrapper.text()).toContain('2 پیشنهاد مناسب')

    const dramaChip = wrapper.findAll<HTMLButtonElement>('.wizard-genre-list .genre-chip')
      .find((button) => button.text() === 'درام')
    await dramaChip?.trigger('click')
    expect(wrapper.text()).toContain('1 پیشنهاد مناسب')
    expect(wrapper.text()).toContain('درام نمونه')
    expect(wrapper.text()).not.toContain('کمدی نمونه')

    const comedyChip = wrapper.findAll<HTMLButtonElement>('.wizard-genre-list .genre-chip')
      .find((button) => button.text() === 'کمدی')
    await comedyChip?.trigger('click')
    expect(wrapper.text()).toContain('2 پیشنهاد مناسب')

    await wrapper.findAll('button').find((button) => button.text() === 'اعمال روی کتابخانه')?.trigger('click')
    expect(wrapper.emitted('apply')?.[0]?.[0]).toMatchObject({
      totalPeople: 2,
      genres: ['درام', 'کمدی']
    })
  })

  it('uses constrained sliders so male plus female never exceeds total cast', async () => {
    const wrapper = mount(PlayFinderWizard, {
      props: { plays: [makePlay('large', 'بزرگ', ['درام'], 3, 2)] },
      global: { stubs: { teleport: true } }
    })

    const sliders = wrapper.findAll<HTMLInputElement>('.wizard-slider-grid input[type="range"]')
    expect(sliders).toHaveLength(3)

    await sliders[0].setValue(3)
    const updated = wrapper.findAll<HTMLInputElement>('.wizard-slider-grid input[type="range"]')
    const total = Number(updated[0].element.value)
    const male = Number(updated[1].element.value)
    const female = Number(updated[2].element.value)
    expect(male + female).toBeLessThanOrEqual(total)
    expect(Number(updated[1].attributes('max'))).toBe(total - female)
    expect(Number(updated[2].attributes('max'))).toBe(total - male)
  })

  it('keeps focus inside the dialog, moves focus to revealed controls, handles Escape, and restores the launcher', async () => {
    const app = document.createElement('div')
    app.id = 'app'
    const launcher = document.createElement('button')
    launcher.textContent = 'باز کردن'
    app.appendChild(launcher)
    document.body.appendChild(app)
    launcher.focus()

    const wrapper = mount(PlayFinderWizard, {
      attachTo: app,
      props: { plays: [drama, comedy] }
    })
    await nextTick()

    const dialog = document.querySelector<HTMLElement>('.play-wizard')
    expect(dialog).not.toBeNull()
    expect(app.hasAttribute('inert')).toBe(true)
    expect(dialog?.contains(document.activeElement)).toBe(true)

    const continueButton = dialog?.querySelector<HTMLButtonElement>('.wizard-continue')
    continueButton?.click()
    await nextTick()
    expect(document.activeElement?.textContent).toContain('زمان و ژانر')

    const focusable = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first.focus()
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    expect(document.activeElement).toBe(last)

    last.focus()
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement).toBe(first)

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
    expect(app.hasAttribute('inert')).toBe(false)
    expect(document.activeElement).toBe(launcher)
  })
})
