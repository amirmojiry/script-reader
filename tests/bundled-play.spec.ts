import { describe, expect, it } from 'vitest'
import { bundledPlay } from '../src/data/bundledPlay'
import { flattenBlocks, validatePlay } from '../src/utils/play'

describe('complete bundled play', () => {
  const blocks = flattenBlocks(bundledPlay)

  it('contains the complete supplied sequence', () => {
    expect(blocks).toHaveLength(489)
    expect(blocks.filter((block) => block.type === 'dialogue')).toHaveLength(461)
    expect(blocks.filter((block) => block.type === 'stage-direction')).toHaveLength(28)
    expect(bundledPlay.characters.map((character) => character.name)).toEqual([
      'پیک', 'مادر', 'پسر', 'دختر', 'پدر', 'زن', 'شوهر'
    ])
  })

  it('preserves the supplied final stage direction and validates canonically', () => {
    expect(blocks.at(-1)).toEqual({
      id: 'block-0489',
      type: 'stage-direction',
      text: '(نور کم میشود در صورتی که آب بالا می آید)'
    })
    expect(validatePlay(bundledPlay)).toEqual({ valid: true, errors: [] })
  })
})
