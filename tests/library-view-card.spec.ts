import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LibraryView from '../src/views/LibraryView.vue'

const routerMocks = vi.hoisted(() => ({ push: vi.fn() }))
const storeMocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  importJson: vi.fn(),
  plays: [{
    id: 'test-play',
    title: 'نمایش آزمایشی',
    author: 'نویسنده',
    characters: [{ id: 'role-1', name: 'نقش اول' }],
    acts: [{
      id: 'act-1',
      title: 'پرده',
      scenes: [{
        id: 'scene-1',
        title: 'صحنه',
        blocks: [{ id: 'block-1', type: 'dialogue', characterId: 'role-1', parts: [{ type: 'speech', text: 'یک دیالوگ کوتاه' }] }]
      }]
    }]
  }]
}))

vi.mock('vue-router', () => ({ useRouter: () => routerMocks }))
vi.mock('../src/stores/plays', () => ({ usePlaysStore: () => storeMocks }))

describe('LibraryView play card', () => {
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
          RouterLink: { template: '<a><slot /></a>' }
        }
      }
    })

    await flushPromises()

    const card = wrapper.get('.play-card')
    expect(card.findAll('.play-card-control')).toHaveLength(4)
    expect(card.findAll('.play-card-metric')).toHaveLength(3)
    expect(card.get('.play-card-open').text()).toBe('باز کردن')
    expect(wrapper.find('.import-help').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('فرمت ورود')
  })
})
