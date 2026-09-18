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

describe('LibraryView play cards and discovery controls', () => {
  beforeEach(() => {
    routerMocks.push.mockReset()
    storeMocks.initialize.mockReset()
    storeMocks.importJson.mockReset()
    storeMocks.initialize.mockResolvedValue(undefined)
  })

  it('uses four equal-control cells and omits the import-format box', async () => {
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
    expect(card.findAll('.play-card-control')).toHaveLength(4)
    expect(card.findAll('.play-card-metric')).toHaveLength(3)
    expect(card.get('.play-card-open').text()).toBe('باز کردن')
    expect(wrapper.find('.import-help').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('فرمت ورود')
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

    const wizardButton = wrapper.findAll('button').find((button) => button.text() === 'ویزارد انتخاب نمایش')
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

  it('filters by author and genre and sorts alphabetically', async () => {
    const wrapper = mount(LibraryView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          PlayFinderWizard: true
        }
      }
    })
    await flushPromises()

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
