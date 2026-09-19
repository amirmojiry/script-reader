<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RehearsalRevealMode } from '../types'

const props = withDefaults(defineProps<{
  text: string
  active: boolean
  revealMode: RehearsalRevealMode
  hiddenLabel?: string
}>(), {
  hiddenLabel: 'نمایش بخش راوی'
})

const revealAll = ref(false)
const progressiveWordCount = ref(5)

const words = computed(() => props.text.trim().split(/\s+/u).filter(Boolean))
const firstWords = computed(() => words.value.slice(0, 3).join(' '))
const progressiveText = computed(() => words.value.slice(0, progressiveWordCount.value).join(' '))
const hasMoreProgressive = computed(() => progressiveWordCount.value < words.value.length)
const concealed = computed(() => props.active && !revealAll.value)

watch(
  () => [props.text, props.active, props.revealMode],
  () => {
    revealAll.value = false
    progressiveWordCount.value = 5
  }
)

function revealNext(): void {
  if (props.revealMode === 'progressive' && hasMoreProgressive.value) {
    progressiveWordCount.value += 5
    return
  }
  revealAll.value = true
}
</script>

<template>
  <span class="narrator-rehearsal-text">
    <button
      v-if="concealed && revealMode === 'hidden'"
      class="narrator-reveal-button"
      type="button"
      @click.stop="revealAll = true"
    >
      {{ hiddenLabel }}
    </button>
    <template v-else-if="concealed">
      <span class="narrator-rehearsal-preview">
        {{ revealMode === 'first-words' ? firstWords : progressiveText }}<span v-if="revealMode === 'first-words' || hasMoreProgressive">…</span>
      </span>
      <button class="narrator-reveal-button compact" type="button" @click.stop="revealNext">
        {{ revealMode === 'progressive' && hasMoreProgressive ? 'ادامه' : 'نمایش کامل' }}
      </button>
    </template>
    <template v-else>{{ text }}</template>
  </span>
</template>
