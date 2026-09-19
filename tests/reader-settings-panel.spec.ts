// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReaderSettingsPanel from '../src/components/ReaderSettingsPanel.vue'
import { DEFAULT_READER_SETTINGS, READER_FONT_OPTIONS } from '../src/utils/settings'

describe('ReaderSettingsPanel', () => {
  it('shows every requested font and emits persisted-setting updates', async () => {
    const wrapper = mount(ReaderSettingsPanel, {
      props: {
        settings: { ...DEFAULT_READER_SETTINGS },
        wakeLockAvailable: true
      }
    })

    const fontSelect = wrapper.get('select')
    expect(fontSelect.findAll('option').map((option) => option.attributes('value'))).toEqual(
      READER_FONT_OPTIONS.map((option) => option.value)
    )

    await fontSelect.setValue('amiri')
    const update = wrapper.emitted('updateSettings')?.at(-1)?.[0]
    expect(update).toMatchObject({ font: 'amiri' })
  })
})
