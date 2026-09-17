import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { bundledPlays, mergeBundledPlay } from '../data/bundledPlays'
import { deletePlay, listPlays, savePlay } from '../services/storage'
import type { Play } from '../types'
import { validatePlay } from '../utils/play'

export const usePlaysStore = defineStore('plays', () => {
  const plays = ref<Play[]>([])
  const loaded = ref(false)

  const byId = computed(() => (id: string) => plays.value.find((play) => play.id === id))

  async function initialize(): Promise<void> {
    if (loaded.value) return
    const stored = await listPlays()
    const bundledIds = new Set(bundledPlays.map((play) => play.id))
    const currentBundled = bundledPlays.map((play) => mergeBundledPlay(play, stored.find((item) => item.id === play.id)))
    for (const play of currentBundled) await savePlay(play)
    plays.value = [...currentBundled, ...stored.filter((play) => !bundledIds.has(play.id))]
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
