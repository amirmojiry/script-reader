// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProofreadingEditor from '../src/components/ProofreadingEditor.vue'

describe('ProofreadingEditor', () => {
  it('uses one editable text field and emits preview/navigation/revert actions', async () => {
    const wrapper = mount(ProofreadingEditor, {
      props: {
        draft: { label: 'دیالوگ شماره 4', text: 'متن فعلی' },
        canRevert: true
      }
    })

    const fields = wrapper.findAll('textarea')
    expect(fields).toHaveLength(1)
    expect(fields[0].element.value).toBe('متن فعلی')
    expect(wrapper.text()).toContain('متن')
    expect(wrapper.text()).not.toContain('متن اشتباه')
    expect(wrapper.text()).not.toContain('متن درست')

    await fields[0].setValue('متن ویرایش‌شده')
    await fields[0].trigger('input')
    expect(wrapper.emitted('preview')?.at(-1)).toEqual(['متن ویرایش‌شده'])

    const next = wrapper.findAll('button').find((button) => button.text().includes('ثبت و بعدی'))
    expect(next).toBeDefined()
    await next!.trigger('click')
    expect(wrapper.emitted('save')?.at(-1)).toEqual(['متن ویرایش‌شده', 1])

    const previous = wrapper.findAll('button').find((button) => button.text() === 'ثبت و قبلی')
    expect(previous).toBeDefined()
    await previous!.trigger('click')
    expect(wrapper.emitted('save')?.at(-1)).toEqual(['متن ویرایش‌شده', -1])

    await wrapper.get('.proofreading-revert-button').trigger('click')
    expect(wrapper.emitted('revert')).toHaveLength(1)
  })
})
