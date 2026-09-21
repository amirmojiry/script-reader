// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProofreadingCorrection } from '../src/types'

const idbMocks = vi.hoisted(() => {
  const store = {
    getAll: vi.fn(),
    delete: vi.fn(async () => undefined),
    put: vi.fn(async () => undefined)
  }
  const transaction = {
    objectStore: vi.fn(() => store),
    done: Promise.resolve()
  }
  const db = {
    transaction: vi.fn(() => transaction)
  }
  const openDB = vi.fn(async () => db)
  return { store, transaction, db, openDB }
})

vi.mock('idb', () => ({
  openDB: idbMocks.openDB
}))

import { clearProofreadingCorrections } from '../src/services/storage'

function correction(id: string, playId: string): ProofreadingCorrection {
  return {
    id,
    playId,
    playTitle: 'نمایش تست',
    blockId: `block-${id}`,
    blockIndex: 1,
    blockType: 'dialogue',
    originalText: 'الف',
    correctedText: 'ب',
    createdAt: '2026-09-21T09:00:00.000Z'
  }
}

describe('proofreading storage', () => {
  beforeEach(() => {
    idbMocks.store.getAll.mockReset()
    idbMocks.store.delete.mockClear()
    idbMocks.db.transaction.mockClear()
    idbMocks.transaction.objectStore.mockClear()
  })

  it('clears all corrections for one play in a single read-write transaction', async () => {
    idbMocks.store.getAll.mockResolvedValue([
      correction('1', 'play-1'),
      correction('2', 'play-1'),
      correction('3', 'play-2')
    ])

    await clearProofreadingCorrections('play-1')

    expect(idbMocks.db.transaction).toHaveBeenCalledTimes(1)
    expect(idbMocks.db.transaction).toHaveBeenCalledWith('proofreadingCorrections', 'readwrite')
    expect(idbMocks.transaction.objectStore).toHaveBeenCalledWith('proofreadingCorrections')
    expect(idbMocks.store.delete).toHaveBeenCalledTimes(2)
    expect(idbMocks.store.delete).toHaveBeenCalledWith('1')
    expect(idbMocks.store.delete).toHaveBeenCalledWith('2')
    expect(idbMocks.store.delete).not.toHaveBeenCalledWith('3')
  })
})
