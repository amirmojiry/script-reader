// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import PlayFinderWizard from '../src/components/PlayFinderWizard.vue'
import type { Play } from '../src/types'

const play: Play = {
  id: 'sample',
  title: 'نمایش نمونه',
  author: 'نویسنده',
  genres: ['درام'],
  characters: [
    { id: 'm', name: 'مرد', gender: 'male' },
    { id: 'f', name: 'زن', gender: 'female' }
  ],
  acts: [{
    id: 'a',
    title: 'پرده',
    scenes: [{
      id: 's',
      title: 'صحنه',
      blocks: [
        { id: 'd1', type: 'dialogue', characterId: 'm', parts: [{ type: 'speech', text: 'سلام دنیا' }] },
        { id: 'd2', type: 'dialogue', characterId: 'f', parts: [{ type: 'speech', text: 'سلام دوباره' }] }
      ]
    }]
  }]
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('PlayFinderWizard', () => {
  it('walks through steps and emits reusable filter criteria', async () => {
    const wrapper = mount(PlayFinderWizard, {
      props: { plays: [play] },
      global: { stubs: { teleport: true } }
    })

    const buttons = () => wrapper.findAll('button')
    await buttons().find((button) => button.text() === 'ادامه')?.trigger('click')
    await buttons().find((button) => button.text() === 'ادامه')?.trigger('click')
    expect(wrapper.text()).toContain('پیشنهاد مناسب')

    await buttons().find((button) => button.text() === 'اعمال روی کتابخانه')?.trigger('click')
    const emitted = wrapper.emitted('apply')?.[0]?.[0]
    expect(emitted).toMatchObject({
      totalPeople: 2,
      maxMinutes: expect.any(Number)
    })
  })

  it('keeps focus inside the dialog when advancing between wizard steps', async () => {
    const app = document.createElement('div')
    app.id = 'app'
    const launcher = document.createElement('button')
    launcher.textContent = 'باز کردن'
    app.appendChild(launcher)
    document.body.appendChild(app)
    launcher.focus()

    const wrapper = mount(PlayFinderWizard, {
      attachTo: app,
      props: { plays: [play] }
    })
    await nextTick()

    const dialog = document.querySelector<HTMLElement>('.play-wizard')
    expect(dialog).not.toBeNull()

    const advance = () => Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      .find((button) => button.textContent?.trim() === 'ادامه')

    let button = advance()
    expect(button).toBeDefined()
    button?.focus()
    button?.click()
    await nextTick()

    expect(dialog?.contains(document.activeElement)).toBe(true)
    expect(document.activeElement?.textContent).toContain('زمان و حال‌وهوای نمایش')

    button = advance()
    expect(button).toBeDefined()
    button?.focus()
    button?.click()
    await nextTick()

    expect(dialog?.contains(document.activeElement)).toBe(true)
    expect(document.activeElement?.textContent).toContain('پیشنهاد مناسب')

    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('moves focus into the modal, traps tab focus, handles Escape, and restores the launcher', async () => {
    const app = document.createElement('div')
    app.id = 'app'
    const launcher = document.createElement('button')
    launcher.textContent = 'باز کردن'
    app.appendChild(launcher)
    document.body.appendChild(app)
    launcher.focus()

    const wrapper = mount(PlayFinderWizard, {
      attachTo: app,
      props: { plays: [play] }
    })
    await nextTick()

    const dialog = document.querySelector<HTMLElement>('.play-wizard')
    expect(dialog).not.toBeNull()
    expect(app.hasAttribute('inert')).toBe(true)
    expect(dialog?.contains(document.activeElement)).toBe(true)

    const focusable = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled])') ?? [])
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
