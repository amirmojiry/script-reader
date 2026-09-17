import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { bundledPlay } from '../data/bundledPlay'
import { deletePlay, listPlays, savePlay } from '../services/storage'
import type { Play } from '../types'
import { validatePlay } from '../utils/play'

function mergeBundledPlay(existing?: Play): Play {
  if (!existing) return bundledPlay
  const colors = new Map(existing.characters.map((character) => [character.id, character.color]))
  return {
    ...bundledPlay,
    characters: bundledPlay.characters.map((character) => {
      const legacyId = character.id === 'woman' ? 'wife' : character.id
      return {
        ...character,
        color: colors.get(character.id) ?? colors.get(legacyId) ?? character.color
      }
    })
  }
}

export const usePlaysStore = defineStore('plays', () => {
  const plays = ref<Play[]>([])
  const loaded = ref(false)

  const byId = computed(() => (id: string) => plays.value.find((play) => play.id === id))

  async function initialize(): Promise<void> {
    if (loaded.value) return
    const stored = await listPlays()
    const existingBundled = stored.find((play) => play.id === bundledPlay.id)
    const currentBundled = mergeBundledPlay(existingBundled)
    await savePlay(currentBundled)
    plays.value = [currentBundled, ...stored.filter((play) => play.id !== bundledPlay.id)]
    loaded.value = true
  }

  async function importJson(raw: string): Promise<Play> {
    const value: unknown = JSON.parse(raw)
    const result = validatePlay(value)
    if (!result.valid) throw new Error(result.errors[0] ?? 'فایل با ساختار نمایشنامهٔ Script Reader سازگار نیست.')
    const play = value as Play
    await savePlay(play)
    const index = plays.value.findIndex((item) => item.id === play.id)
    if (index >= 0) plays.value[index] = play
    else plays.value.push(play)
    return play
  }

  async function updateCharacterColor(playId: string, characterId: string, color: string): Promise<void> {
    const play = byId.value(playId)
    if (!play) return
    const updated: Play = {
      ...play,
      characters: play.characters.map((character) => character.id === characterId ? { ...character, color } : character)
    }
    await savePlay(updated)
    const index = plays.value.findIndex((item) => item.id === playId)
    if (index >= 0) plays.value[index] = updated
  }

  async function remove(playId: string): Promise<void> {
    await deletePlay(playId)
    plays.value = plays.value.filter((play) => play.id !== playId)
  }

  return { plays, loaded, byId, initialize, importJson, updateCharacterColor, remove }
})
