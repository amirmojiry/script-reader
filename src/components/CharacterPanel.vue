<script setup lang="ts">
import type { Character } from '../types'
import type { CharacterStats } from '../utils/play'
import { timelinePositionPercent } from '../utils/timeline'

const props = defineProps<{
  characters: Character[]
  stats: Record<string, CharacterStats>
  selected: string[]
  myCharacterId?: string
}>()

const emit = defineEmits<{
  toggle: [characterId: string]
  chooseMine: [characterId: string]
  jump: [blockIndex: number]
  changeColor: [characterId: string, color: string]
}>()

const maxIndex = () => Math.max(1, ...Object.values(props.stats).flatMap((item) => item.blockIndexes))
</script>

<template>
  <aside class="character-panel card">
    <div class="panel-heading">
      <p class="eyebrow">نقش‌ها</p>
      <h2>شخصیت‌ها</h2>
      <p class="muted">هایلایت، نقش تمرین و پراکندگی دیالوگ‌ها</p>
    </div>

    <div class="character-list">
      <article v-for="character in props.characters" :key="character.id" class="character-item">
        <div class="character-topline">
          <label class="character-select">
            <input :checked="selected.includes(character.id)" type="checkbox" @change="emit('toggle', character.id)" />
            <input
              class="color-input"
              type="color"
              :value="character.color || '#cbd5e1'"
              :aria-label="`رنگ ${character.name}`"
              @input="emit('changeColor', character.id, ($event.target as HTMLInputElement).value)"
            />
            <strong>{{ character.name }}</strong>
          </label>
          <button class="small-button" :class="{ active: myCharacterId === character.id }" @click="emit('chooseMine', character.id)">
            نقش من
          </button>
        </div>

        <div class="stats-row">
          <span><strong>{{ stats[character.id]?.dialogueCount ?? 0 }}</strong> دیالوگ</span>
          <span><strong>{{ (stats[character.id]?.shareOfWords ?? 0).toFixed(1) }}٪</strong> گفتار</span>
          <span>≈{{ (stats[character.id]?.estimatedMinutes ?? 0).toFixed(1) }} دقیقه</span>
        </div>

        <div class="timeline" aria-label="پراکندگی دیالوگ‌ها از ابتدای نمایش در سمت راست">
          <button
            v-for="index in stats[character.id]?.blockIndexes ?? []"
            :key="index"
            class="timeline-tick"
            :style="{ right: `${timelinePositionPercent(index, maxIndex())}%`, background: character.color || '#4f46e5' }"
            :title="`پرش به سطر ${index + 1}`"
            @click="emit('jump', index)"
          />
        </div>
        <div class="timeline-labels" aria-hidden="true"><span>شروع</span><span>پایان</span></div>
      </article>
    </div>
  </aside>
</template>
