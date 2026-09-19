// @vitest-environment jsdom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_READER_SETTINGS } from '../src/utils/settings'
import SettingsView from '../src/views/SettingsView.vue'

const storageMocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn()
}))

vi.mock('../src/services/storage', () => storageMocks)
vi.mock('../src/services/wakeLock', () => ({ wakeLockSupported: () => false }))

describe('SettingsView', () => {
  beforeEach(() => {
    storageMocks.getSettings.mockReset()
    storageMocks.saveSettings.mockReset()
    storageMocks.getSettings.mockResolvedValue({ ...DEFAULT_READER_SETTINGS, font: 'amiri', fontSize: 22, theme: 'dark' })
    storageMocks.saveSettings.mockResolvedValue(undefined)
  })

  it('restores persisted settings and saves changes immediately', async () => {
    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' }
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
})
