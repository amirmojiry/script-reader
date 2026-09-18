// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CharacterPanel from '../src/components/CharacterPanel.vue'

describe('CharacterPanel navigation', () => {
  it('jumps to the first dialogue when شروع is clicked and exposes an in-panel close control', async () => {
    const wrapper = mount(CharacterPanel, {
      props: {
        characters: [{ id: 'anna', name: 'آنا', gender: 'female' }],
        stats: {
          anna: { dialogueCount: 2, wordCount: 10, shareOfWords: 100, estimatedMinutes: 0.1, blockIndexes: [4, 9] }
        },
        selected: [],
        narratorStats: { dialogueCount: 2, wordCount: 6, shareOfWords: 10, estimatedMinutes: 0.04, blockIndexes: [1, 5] },
        narratorJumpIndexes: [5],
        narratorSelected: false,
        narratorIsMine: false,
        narratorColor: '#ddd6fe'
      }
    })

    const narratorCard = wrapper.findAll('.character-item')[0]
    expect(narratorCard.findAll('.timeline-tick')).toHaveLength(1)
    await narratorCard.get('.timeline-start-button').trigger('click')
    expect(wrapper.emitted('jump')?.at(-1)).toEqual([5])

    const roleCard = wrapper.findAll('.character-item')[1]
    await roleCard.get('.timeline-start-button').trigger('click')
    expect(wrapper.emitted('jump')?.at(-1)).toEqual([4])

    await wrapper.get('.panel-close-button').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
