// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_READER_SETTINGS } from '../src/utils/settings'
import SettingsView from '../src/views/SettingsView.vue'

const storageMocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn()
}))
const routeMocks = vi.hoisted(() => ({
  query: {} as Record<string, string | undefined>
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeMocks.query })
}))
vi.mock('../src/services/storage', () => storageMocks)
vi.mock('../src/services/wakeLock', () => ({ wakeLockSupported: () => false }))

const RouterLinkStub = defineComponent({
  props: {
    to: { type: Object, required: true }
  },
  template: '<a :data-to="JSON.stringify(to)"><slot /></a>'
})

describe('SettingsView', () => {
  beforeEach(() => {
    storageMocks.getSettings.mockReset()
    storageMocks.saveSettings.mockReset()
    storageMocks.getSettings.mockResolvedValue({ ...DEFAULT_READER_SETTINGS, font: 'amiri', fontSize: 22, theme: 'dark' })
    storageMocks.saveSettings.mockResolvedValue(undefined)
    routeMocks.query = {}
  })

  it('restores persisted settings and saves changes immediately', async () => {
    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    })

    await flushPromises()
    expect(storageMocks.getSettings).toHaveBeenCalledTimes(1)
    expect(wrapper.get('select').element.value).toBe('amiri')
    expect(wrapper.classes()).toContain('dark-theme')

    const sizeSlider = wrapper.findAll('input[type="range"]')[0]
    await sizeSlider.setValue('24')
    await flushPromises()

    expect(storageMocks.saveSettings).toHaveBeenLastCalledWith(expect.objectContaining({
      font: 'amiri',
      fontSize: 24,
      theme: 'dark'
    }))
    expect(wrapper.text()).toContain('تنظیمات ذخیره شد.')
  })

  it('returns to the originating play or library using only local route targets', async () => {
    routeMocks.query = { from: 'reader', play: 'test-play' }
    const fromReader = mount(SettingsView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    })
    await flushPromises()
    expect(JSON.parse(fromReader.get('.settings-back-link').attributes('data-to')!)).toEqual({
      name: 'reader',
      params: { id: 'test-play' }
    })
    fromReader.unmount()

    routeMocks.query = { from: 'library' }
    const fromLibrary = mount(SettingsView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    })
    await flushPromises()
    expect(JSON.parse(fromLibrary.get('.settings-back-link').attributes('data-to')!)).toEqual({
      name: 'library'
    })
    fromLibrary.unmount()

    routeMocks.query = { from: 'reader', play: '' }
    const invalidReader = mount(SettingsView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    })
    await flushPromises()
    expect(JSON.parse(invalidReader.get('.settings-back-link').attributes('data-to')!)).toEqual({
      name: 'library'
    })
  })
})
