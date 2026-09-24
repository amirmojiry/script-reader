// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LibraryView from '../src/views/LibraryView.vue'

const routerMocks = vi.hoisted(() => ({ push: vi.fn() }))
const storeMocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  importJson: vi.fn(),
  plays: [
    {
      id: 'test-play-b',
      title: 'ب نمایش',
      author: 'نویسنده دوم',
      translator: 'مترجم',
      translators: ['مترجم', 'تینوش نظم‌جو', 'نگار جواهریان'],
      genres: ['کمدی'],
      characters: [
        { id: 'role-1', name: 'نقش اول', gender: 'male' },
        { id: 'role-2', name: 'نقش دوم', gender: 'unknown' }
      ],
      acts: [{
        id: 'act-1',
        title: 'پرده',
        scenes: [{
          id: 'scene-1',
          title: 'صحنه',
          blocks: [{ id: 'block-1', type: 'dialogue', characterId: 'role-1', parts: [{ type: 'speech', text: 'واژه '.repeat(260) }] }]
        }]
      }]
    },
    {
      id: 'test-play-a',
      title: 'آ نمایش',
      author: 'نویسنده اول',
      translator: 'تینوش نظم جو',
      genres: ['درام'],
      characters: [
        { id: 'role-1', name: 'نقش اول', gender: 'female' },
        { id: 'role-2', name: 'نقش دوم', gender: 'unknown' },
        { id: 'role-3', name: 'نقش سوم', gender: 'unknown' }
      ],
      acts: [{
        id: 'act-1',
        title: 'پرده',
        scenes: [{
          id: 'scene-1',
          title: 'صحنه',
          blocks: [{ id: 'block-1', type: 'dialogue', characterId: 'role-1', parts: [{ type: 'speech', text: 'واژه '.repeat(390) }] }]
        }]
      }]
    }
  ]
}))

vi.mock('vue-router', () => ({ useRouter: () => routerMocks }))
vi.mock('../src/stores/plays', () => ({ usePlaysStore: () => storeMocks }))

const WizardApplyStub = defineComponent({
  emits: ['apply', 'close'],
  template: `<button
    class="wizard-apply-test"
    @click="$emit('apply', { totalPeople: 1, malePeople: 1, femalePeople: 0, maxMinutes: 1 })"
  >اعمال تست</button>`
})

const WizardGenreApplyStub = defineComponent({
  emits: ['apply', 'close'],
  template: `<button
    class="wizard-genre-apply-test"
    @click="$emit('apply', { totalPeople: 3, malePeople: 1, femalePeople: 1, maxMinutes: 3, genres: ['درام'] })"
  >اعمال ژانر تست</button>`
})

describe('LibraryView play cards and discovery controls', () => {
  beforeEach(() => {
    routerMocks.push.mockReset()
    storeMocks.initialize.mockReset()
    storeMocks.importJson.mockReset()
    storeMocks.initialize.mockResolvedValue(undefined)
  })

  it('links play titles, uses three metric cells, and omits the separate open button', async () => {
    const wrapper = mount(LibraryView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          PlayFinderWizard: true
        }
      }
    })

    await flushPromises()

    const card = wrapper.findAll('.play-card')[0]
    expect(card.findAll('.play-card-control')).toHaveLength(3)
    const metrics = card.findAll('.play-card-metric')
    expect(metrics).toHaveLength(3)
    expect(metrics.map((metric) => metric.get('.play-card-metric-value').text())).toEqual(['3', '1', "3'"])
    expect(metrics.map((metric) => metric.attributes('title'))).toEqual(['نقش', 'دیالوگ', 'مدت به دقیقه'])
    expect(metrics.map((metric) => metric.get('.visually-hidden').text())).toEqual(['3 نقش', '1 دیالوگ', '3 دقیقه'])
    expect(metrics.every((metric) => metric.get('.play-card-metric-value').attributes('aria-hidden') === 'true')).toBe(true)
    expect(metrics.every((metric) => metric.find('svg').exists())).toBe(true)
    expect(metrics.every((metric) => metric.find('svg').attributes('aria-hidden') === 'true')).toBe(true)
    expect(metrics[2].get('.play-card-duration-value').attributes('dir')).toBe('ltr')
    expect(card.find('.play-card-open').exists()).toBe(false)
    expect(card.get('.play-title-link').text()).toBe('آ نمایش')
    expect(wrapper.find('.import-help').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('فرمت ورود')
    const heroActions = wrapper.findAll('.library-action-button')
    expect(heroActions).toHaveLength(3)
    expect(heroActions.map((action) => action.attributes('aria-label'))).toEqual([
      'ویزارد انتخاب نمایش',
      'تنظیمات',
      'افزودن JSON'
    ])
  })

  it('preserves wizard limits below library slider minima until the user changes those sliders', async () => {
    const wrapper = mount(LibraryView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          PlayFinderWizard: WizardApplyStub
        }
      }
    })
    await flushPromises()

    const wizardButton = wrapper.find<HTMLButtonElement>('.library-wizard-button')
    await wizardButton?.trigger('click')
    await wrapper.get('.wizard-apply-test').trigger('click')

    expect(wrapper.findAll('.play-card')).toHaveLength(0)

    const ranges = wrapper.findAll('.range-filter')
    await ranges[0].findAll('input[type="range"]')[1].setValue(2)
    expect(wrapper.findAll('.play-card')).toHaveLength(0)

    await ranges[1].findAll('input[type="range"]')[1].setValue(2)
    expect(wrapper.findAll('.play-card')).toHaveLength(1)
    expect(wrapper.get('.play-card h2').text()).toBe('ب نمایش')
  })

  it('lets the all-genres option clear a multi-genre wizard restriction without resetting other wizard criteria', async () => {
    const wrapper = mount(LibraryView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          PlayFinderWizard: WizardGenreApplyStub
        }
      }
    })
    await flushPromises()

    const wizardButton = wrapper.find<HTMLButtonElement>('.library-wizard-button')
    await wizardButton?.trigger('click')
    await wrapper.get('.wizard-genre-apply-test').trigger('click')

    expect(wrapper.findAll('.play-card')).toHaveLength(1)
    expect(wrapper.get('.play-card h2').text()).toBe('آ نمایش')

    const genreSelect = wrapper.findAll('.metadata-filter-grid select')[2]
    expect((genreSelect.element as HTMLSelectElement).value).toBe('__wizard__')
    expect(genreSelect.text()).toContain('ژانرهای ویزارد: درام')

    await genreSelect.setValue('')
    expect(wrapper.findAll('.play-card')).toHaveLength(2)
    expect((genreSelect.element as HTMLSelectElement).value).toBe('')
  })

  it('lists translators individually, deduplicates half-space variants, and matches either spelling', async () => {
    const wrapper = mount(LibraryView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, PlayFinderWizard: true } }
    })
    await flushPromises()

    const translatorSelect = wrapper.findAll('.metadata-filter-grid select')[1]
    const options = translatorSelect.findAll('option').map((option) => option.text())
    expect(options.filter((option) => option === 'تینوش نظم‌جو')).toHaveLength(1)
    expect(options).not.toContain('تینوش نظم جو')
    expect(options).toContain('نگار جواهریان')
    expect(options).not.toContain('نگار جواهریان / تینوش نظم‌جو')
    await translatorSelect.setValue('تینوش نظم‌جو')
    expect(wrapper.findAll('.play-card')).toHaveLength(2)
  })

  it('filters by clickable genre chips, author and select controls, and sorts alphabetically', async () => {
    const wrapper = mount(LibraryView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          PlayFinderWizard: true
        }
      }
    })
    await flushPromises()

    const comedyChip = wrapper.findAll<HTMLButtonElement>('.genre-chip').find((chip) => chip.text() === 'کمدی')
    await comedyChip?.trigger('click')
    expect(wrapper.findAll('.play-card')).toHaveLength(1)
    expect(wrapper.get('.play-card h2').text()).toBe('ب نمایش')
    await wrapper.get<HTMLButtonElement>('.genre-chip.active').trigger('click')
    expect(wrapper.findAll('.play-card')).toHaveLength(2)

    const selects = wrapper.findAll('.metadata-filter-grid select')
    await selects[0].setValue('نویسنده اول')
    expect(wrapper.findAll('.play-card')).toHaveLength(1)
    expect(wrapper.get('.play-card h2').text()).toBe('آ نمایش')

    await selects[0].setValue('')
    await selects[1].setValue('مترجم')
    expect(wrapper.findAll('.play-card')).toHaveLength(1)
    expect(wrapper.get('.play-card h2').text()).toBe('ب نمایش')

    await selects[1].setValue('')
    await selects[2].setValue('کمدی')
    expect(wrapper.findAll('.play-card')).toHaveLength(1)
    expect(wrapper.get('.play-card h2').text()).toBe('ب نمایش')

    await selects[2].setValue('')
    await selects[3].setValue('title-asc')
    expect(wrapper.findAll('.play-card h2').map((item) => item.text())).toEqual(['آ نمایش', 'ب نمایش'])
  })
})
