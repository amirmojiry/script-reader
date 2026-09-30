import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReadingState } from '../src/types'

const idbMocks = vi.hoisted(() => {
  const db = {
    get: vi.fn(),
    put: vi.fn(async () => undefined)
  }
  const openDB = vi.fn(async () => db)
  return { db, openDB }
})

vi.mock('idb', () => ({
  openDB: idbMocks.openDB
}))

import { getReadingState } from '../src/services/storage'

function state(overrides: Partial<ReadingState> = {}): ReadingState {
  return {
    playId: 'builtin:gogol:bazras',
    selectedCharacterIds: ['governor'],
    mode: 'rehearsal',
    ...overrides
  }
}

describe('reading-state storage migration', () => {
  beforeEach(() => {
    idbMocks.db.get.mockReset()
    idbMocks.db.put.mockClear()
  })

  it('removes persisted character selections that no longer exist in the current cast', async () => {
    idbMocks.db.get.mockResolvedValue(state({
      selectedCharacterIds: ['governor', 'ensemble', 'pugovitsin', 'governor'],
      myCharacterId: 'ensemble'
    }))

    const result = await getReadingState(
      'builtin:gogol:bazras',
      ['governor', 'postmaster']
    )

    expect(result).toEqual(state({
      selectedCharacterIds: ['governor'],
      myCharacterId: undefined
    }))
    expect(idbMocks.db.put).toHaveBeenCalledTimes(1)
    expect(idbMocks.db.put).toHaveBeenCalledWith('readingStates', result)
  })

  it('keeps the existing Horses wife-to-woman migration compatible with cast sanitization', async () => {
    idbMocks.db.get.mockResolvedValue(state({
      playId: 'horses-behind-the-window',
      selectedCharacterIds: ['wife', 'mother'],
      myCharacterId: 'wife'
    }))

    const result = await getReadingState(
      'horses-behind-the-window',
      ['woman', 'mother']
    )

    expect(result?.selectedCharacterIds).toEqual(['woman', 'mother'])
    expect(result?.myCharacterId).toBe('woman')
    expect(idbMocks.db.put).toHaveBeenCalledWith('readingStates', result)
  })

  it('does not rewrite an already valid reading state', async () => {
    const stored = state({
      selectedCharacterIds: ['governor', 'postmaster'],
      myCharacterId: 'governor'
    })
    idbMocks.db.get.mockResolvedValue(stored)

    const result = await getReadingState(
      'builtin:gogol:bazras',
      ['governor', 'postmaster']
    )

    expect(result).toEqual(stored)
    expect(idbMocks.db.put).not.toHaveBeenCalled()
  })
})
