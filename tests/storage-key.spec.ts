import { describe, expect, it } from 'vitest'
import { makePairKey, parsePairKey } from '../src/utils/storageKey'

describe('storage composite keys', () => {
  it('does not collide when ids contain separators', () => {
    expect(makePairKey('a', 'b:c')).not.toBe(makePairKey('a:b', 'c'))
  })

  it('round-trips arbitrary string ids', () => {
    const key = makePairKey('play:one/دو', 'block:1?x=y')
    expect(parsePairKey(key)).toEqual(['play:one/دو', 'block:1?x=y'])
  })

  it('ignores legacy or malformed keys safely', () => {
    expect(parsePairKey('a:b:c')).toBeUndefined()
    expect(parsePairKey('{not-json')).toBeUndefined()
  })
})
