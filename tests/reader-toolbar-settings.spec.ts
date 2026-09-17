import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ReaderToolbar from '../src/components/ReaderToolbar.vue'
import type { ReaderSettings } from '../src/types'

const legacyInitialSettings: ReaderSettings = {
  fontSize: 17,
  lineHeight: 1.9,
  font: 'system',
  theme: 'light',
  hideStageDirections: false,
  keepAwake: false,
  rehearsalRevealMode: 'hidden',
  rehearsalCueOnly: false
}

describe('ReaderToolbar persisted settings safety', () => {
  it('does not emit an automatic settings write while mounting legacy/default reader state', () => {
    const wrapper = mount(ReaderToolbar, {
      props: {
        mode: 'read',
        settings: legacyInitialSettings,
        wakeLockAvailable: true,
        speechAvailable: false,
        searchQuery: '',
        searchCount: 0
      },
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.emitted('updateSettings')).toBeUndefined()
  })
})
