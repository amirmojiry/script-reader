<script setup lang="ts">
import type { Character } from '../types'
import type { CharacterStats } from '../utils/play'
import { genderLabel } from '../utils/library'
import { timelinePositionPercent } from '../utils/timeline'

const props = defineProps<{
  characters: Character[]
  stats: Record<string, CharacterStats>
  selected: string[]
  myCharacterId?: string
  narratorStats: CharacterStats
  narratorJumpIndexes: number[]
  narratorSelected: boolean
  narratorIsMine: boolean
  narratorColor: string
}>()

const emit = defineEmits<{
  close: []
  toggle: [characterId: string]
  chooseMine: [characterId: string]
  toggleNarrator: []
  chooseNarratorMine: []
  jump: [blockIndex: number]
  changeColor: [characterId: string, color: string]
  changeNarratorColor: [color: string]
}>()

const maxIndex = () => Math.max(
  1,
  ...Object.values(props.stats).flatMap((item) => item.blockIndexes),
  ...props.narratorJumpIndexes
)

function jumpToCharacterStart(characterId: string): void {
  const target = props.stats[characterId]?.blockIndexes[0]
  if (target !== undefined) emit('jump', target)
}

function jumpToNarratorStart(): void {
  const target = props.narratorJumpIndexes[0]
  if (target !== undefined) emit('jump', target)
}
</script>

<template>
  <aside class="character-panel card">
    <div class="panel-heading">
      <div class="panel-heading-row">
        <div>
          <p class="eyebrow">نقش‌ها</p>
          <h2>شخصیت‌ها و راوی</h2>
        </div>
        <button class="icon-button panel-close-button" type="button" aria-label="بستن نقش‌ها" @click="emit('close')">×</button>
      </div>
      <p class="muted">هایلایت، نقش تمرین و پراکندگی دیالوگ‌ها</p>
    </div>

    <div class="character-list">
      <article class="character-item narrator-item">
        <div class="character-topline">
          <label class="character-select">
            <input :checked="narratorSelected" type="checkbox" @change="emit('toggleNarrator')" />
            <input
              class="color-input"
              type="color"
              :value="narratorColor"
              aria-label="رنگ راوی"
              @input="emit('changeNarratorColor', ($event.target as HTMLInputElement).value)"
            />
            <strong>راوی</strong>
            <span class="role-gender">نامشخص</span>
          </label>
          <button class="small-button" :class="{ active: narratorIsMine }" @click="emit('chooseNarratorMine')">
            نقش من
          </button>
        </div>

        <div class="stats-row">
          <span><strong>{{ narratorStats.dialogueCount }}</strong> بخش</span>
          <span><strong>{{ narratorStats.wordCount }}</strong> واژه</span>
          <span>≈{{ narratorStats.estimatedMinutes.toFixed(1) }} دقیقه</span>
        </div>

        <div class="timeline" aria-label="پراکندگی بخش‌های راوی از ابتدای نمایش در سمت راست">
          <button
            v-for="index in narratorJumpIndexes"
            :key="index"
            class="timeline-tick"
            :style="{ right: `${timelinePositionPercent(index, maxIndex())}%`, background: narratorColor }"
            :title="`پرش به سطر ${index + 1}`"
            @click="emit('jump', index)"
          />
        </div>
        <div class="timeline-labels">
          <button
            class="timeline-start-button"
            type="button"
            :disabled="narratorJumpIndexes.length === 0"
            @click="jumpToNarratorStart"
          >
            شروع
          </button>
          <span aria-hidden="true">پایان</span>
        </div>
      </article>

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
            <span class="role-gender">{{ genderLabel(character.gender) }}</span>
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
        <div class="timeline-labels">
          <button
            class="timeline-start-button"
            type="button"
            :disabled="!(stats[character.id]?.blockIndexes.length)"
            @click="jumpToCharacterStart(character.id)"
          >
            شروع
          </button>
          <span aria-hidden="true">پایان</span>
        </div>
      </article>
    </div>
  </aside>
</template>
