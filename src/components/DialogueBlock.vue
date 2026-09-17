<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Character, DialogueBlock, ReaderMode, RehearsalRevealMode } from '../types'
import { dialogueText } from '../utils/play'

const props = defineProps<{
  block: DialogueBlock
  character?: Character
  mode: ReaderMode
  isMine: boolean
  highlighted: boolean
  current: boolean
  revealMode: RehearsalRevealMode
}>()

const revealAll = ref(false)
const progressiveWordCount = ref(5)

watch(() => props.block.id, () => {
  revealAll.value = false
  progressiveWordCount.value = 5
})

const spokenText = computed(() => dialogueText(props.block))
const firstWords = computed(() => spokenText.value.split(/\s+/u).slice(0, 3).join(' '))
const progressiveText = computed(() => spokenText.value.split(/\s+/u).slice(0, progressiveWordCount.value).join(' '))
const isOwnRehearsal = computed(() => props.mode === 'rehearsal' && props.isMine && !revealAll.value)
const hasMoreProgressive = computed(() => progressiveWordCount.value < spokenText.value.split(/\s+/u).length)

function revealNext(): void {
  if (props.revealMode === 'progressive' && hasMoreProgressive.value) {
    progressiveWordCount.value += 5
    return
  }
  revealAll.value = true
}
</script>

<template>
  <article
    :id="`block-${block.id}`"
    class="dialogue-block"
    :class="{ highlighted, current, mine: isMine }"
    :style="highlighted ? { '--highlight': character?.color || '#e0e7ff' } : undefined"
    tabindex="0"
  >
    <header>
      <strong>{{ character?.name || block.characterId }}</strong>
      <span v-if="isMine" class="mine-badge">نقش من</span>
    </header>

    <template v-if="isOwnRehearsal">
      <button v-if="revealMode === 'hidden'" class="hidden-line" @click.stop="revealAll = true">نمایش دیالوگ</button>
      <div v-else class="rehearsal-hint">
        <p v-if="revealMode === 'first-words'">{{ firstWords }}…</p>
        <p v-else>{{ progressiveText }}<span v-if="hasMoreProgressive">…</span></p>
        <button class="small-button" @click.stop="revealNext">
          {{ revealMode === 'progressive' && hasMoreProgressive ? 'ادامه' : 'نمایش کامل' }}
        </button>
      </div>
    </template>

    <p v-else class="dialogue-copy">
      <template v-for="(part, index) in block.parts" :key="index">
        <span v-if="part.type === 'speech'">{{ part.text }} </span>
        <em v-else class="inline-direction">({{ part.text }})</em>
      </template>
    </p>
  </article>
</template>
