import { openDB } from 'idb'
import type { NoteRecord, Play, ReaderSettings, ReadingState } from '../types'
import { makePairKey, parsePairKey } from '../utils/storageKey'

const DB_NAME = 'script-reader'
const DB_VERSION = 1

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('plays')) db.createObjectStore('plays', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('readingStates')) db.createObjectStore('readingStates', { keyPath: 'playId' })
    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings')
    if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('bookmarks')) db.createObjectStore('bookmarks')
  }
})

export async function savePlay(play: Play): Promise<void> {
  const db = await dbPromise
  await db.put('plays', play)
}

export async function listPlays(): Promise<Play[]> {
  const db = await dbPromise
  return db.getAll('plays')
}

export async function deletePlay(playId: string): Promise<void> {
  const db = await dbPromise
  await db.delete('plays', playId)
}

export async function saveReadingState(state: ReadingState): Promise<void> {
  const db = await dbPromise
  await db.put('readingStates', state)
}

export async function getReadingState(playId: string): Promise<ReadingState | undefined> {
  const db = await dbPromise
  return db.get('readingStates', playId)
}

export async function saveSettings(settings: ReaderSettings): Promise<void> {
  const db = await dbPromise
  await db.put('settings', settings, 'reader')
}

export async function getSettings(): Promise<ReaderSettings | undefined> {
  const db = await dbPromise
  return db.get('settings', 'reader')
}

export async function saveNote(note: NoteRecord): Promise<void> {
  const db = await dbPromise
  await db.put('notes', note)
}

export async function deleteNote(noteId: string): Promise<void> {
  const db = await dbPromise
  await db.delete('notes', noteId)
}

export async function listNotes(playId: string): Promise<NoteRecord[]> {
  const db = await dbPromise
  const all = await db.getAll('notes') as NoteRecord[]
  return all.filter((note) => note.playId === playId)
}

export async function toggleBookmark(playId: string, blockId: string, active: boolean): Promise<void> {
  const db = await dbPromise
  const key = makePairKey(playId, blockId)
  if (active) await db.put('bookmarks', true, key)
  else await db.delete('bookmarks', key)
}

export async function isBookmarked(playId: string, blockId: string): Promise<boolean> {
  const db = await dbPromise
  return Boolean(await db.get('bookmarks', makePairKey(playId, blockId)))
}

export async function listBookmarks(playId: string): Promise<string[]> {
  const db = await dbPromise
  const keys = await db.getAllKeys('bookmarks')
  return keys.flatMap((key) => {
    if (typeof key !== 'string') return []
    const pair = parsePairKey(key)
    return pair?.[0] === playId ? [pair[1]] : []
  })
}
