// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProofreadingEditor from '../src/components/ProofreadingEditor.vue'

describe('ProofreadingEditor', () => {
  it('shows original text and emits an edited replacement', async () => {
    const wrapper = mount(ProofreadingEditor, {
      props: {
        draft: { label: 'دیالوگ شماره 4', originalText: 'متن غلط' }
      }
    })

    const fields = wrapper.findAll('textarea')
    expect(fields[0].element.value).toBe('متن غلط')
    expect(fields[0].attributes('readonly')).toBeDefined()
    expect(wrapper.get('.primary-button').attributes('disabled')).toBeDefined()

    await fields[1].setValue('متن درست')
    expect(wrapper.get('.primary-button').attributes('disabled')).toBeUndefined()
    await wrapper.get('.primary-button').trigger('click')
    expect(wrapper.emitted('save')?.[0]).toEqual(['متن درست'])
  })
})
