<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RehearsalRevealText from './RehearsalRevealText.vue'
import type { Character, DialogueBlock, ReaderMode, RehearsalRevealMode } from '../types'
import { blockText, characterDialogueText, dialogueRenderSegments } from '../utils/play'
import type { ProofreadingDisplaySegment } from '../utils/proofreading'

const props = defineProps<{
  block: DialogueBlock
  character?: Character
  characters?: Character[]
  mode: ReaderMode
  isMine: boolean
  highlighted: boolean
  highlightColor?: string
  current: boolean
  revealMode: RehearsalRevealMode
  narratorHighlighted: boolean
  narratorIsMine: boolean
  narratorColor: string
  debugMode?: boolean
  proofreadingSegments?: ProofreadingDisplaySegment[]
}>()

const emit = defineEmits<{
  proofread: [originalText: string, originalOffset: number]
}>()

const revealAll = ref(false)
const progressiveWordCount = ref(5)
const dialogueCopyRef = ref<HTMLElement | null>(null)

watch(() => props.block.id, () => {
  revealAll.value = false
  progressiveWordCount.value = 5
})

const displayCharacters = computed(() => props.characters?.length ? props.characters : props.character ? [props.character] : [])
const displayName = computed(() => displayCharacters.value.map((character) => character.name).join(' و ') || props.block.characterId)
const resolvedHighlightColor = computed(() => props.highlightColor || displayCharacters.value[0]?.color || '#e0e7ff')
const spokenText = computed(() => characterDialogueText(props.block))
const renderSegments = computed(() => dialogueRenderSegments(props.block))
const proofreadingRenderSegments = computed<ProofreadingDisplaySegment[]>(() =>
  props.proofreadingSegments ?? [{ text: blockText(props.block), changed: false }]
)
const narratorSegments = computed(() => renderSegments.value.filter((segment) => segment.type === 'narration'))
const hasNarration = computed(() => narratorSegments.value.length > 0)
const narratorOwnRehearsal = computed(() => props.mode === 'rehearsal' && props.narratorIsMine && !props.debugMode)
const firstWords = computed(() => spokenText.value.split(/\s+/u).slice(0, 3).join(' '))
const progressiveText = computed(() => spokenText.value.split(/\s+/u).slice(0, progressiveWordCount.value).join(' '))
const isOwnRehearsal = computed(() => props.mode === 'rehearsal' && props.isMine && !revealAll.value && !props.debugMode)
const hasMoreProgressive = computed(() => progressiveWordCount.value < spokenText.value.split(/\s+/u).length)

interface ProofreadingSelection {
  text: string
  offset: number
}

function selectedTextInBlock(): ProofreadingSelection | undefined {
  if (typeof window === 'undefined') return undefined
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return undefined
  const range = selection.getRangeAt(0)
  const root = dialogueCopyRef.value
  const node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer as Element
    : range.commonAncestorContainer.parentElement
  if (!root || !node || !root.contains(node)) return undefined

  const rawText = selection.toString()
  const text = rawText.trim()
  if (!text) return undefined
  const leadingTrim = rawText.length - rawText.trimStart().length

  const prefixRange = document.createRange()
  prefixRange.selectNodeContents(root)
  prefixRange.setEnd(range.startContainer, range.startOffset)
  return { text, offset: prefixRange.toString().length + leadingTrim }
}

function proofreadSelection(): void {
  if (!props.debugMode) return
  const selected = selectedTextInBlock()
  if (selected) emit('proofread', selected.text, selected.offset)
}

function proofreadFallback(): void {
  if (!props.debugMode) return
  const selected = selectedTextInBlock()
  if (!selected) {
    const effectiveText = props.proofreadingSegments !== undefined
      ? props.proofreadingSegments.map((segment) => segment.text).join('')
      : blockText(props.block)
    emit('proofread', effectiveText, 0)
  }
}

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
    :style="highlighted ? { '--highlight': resolvedHighlightColor } : undefined"
    tabindex="0"
    :role="debugMode ? 'button' : undefined"
    :class="{ highlighted, current, mine: isMine, 'has-narration': hasNarration, 'proofreading-target': debugMode }"
    @mouseup="proofreadSelection"
    @click="proofreadFallback"
    @keydown.enter.prevent="proofreadFallback"
    @keydown.space.prevent="proofreadFallback"
  >
    <header>
      <strong>{{ displayName }}</strong>
      <span v-if="isMine" class="mine-badge">نقش من</span>
      <span v-if="narratorIsMine && hasNarration" class="narrator-badge">راوی من</span>
    </header>

    <template v-if="isOwnRehearsal">
      <p v-if="hasNarration && (narratorHighlighted || narratorIsMine)" class="rehearsal-narration">
        <em
          v-for="(segment, index) in narratorSegments"
          :key="index"
          class="inline-direction narrator-segment"
          :class="{ 'narrator-highlighted': narratorHighlighted, 'narrator-mine': narratorIsMine }"
          :style="narratorHighlighted || narratorIsMine ? { '--narrator-highlight': narratorColor } : undefined"
        >{{ segment.text }}</em>
      </p>
      <button v-if="revealMode === 'hidden'" class="hidden-line" @click.stop="revealAll = true">نمایش دیالوگ</button>
      <div v-else class="rehearsal-hint">
        <p v-if="revealMode === 'first-words'">{{ firstWords }}…</p>
        <p v-else>{{ progressiveText }}<span v-if="hasMoreProgressive">…</span></p>
        <button class="small-button" @click.stop="revealNext">
          {{ revealMode === 'progressive' && hasMoreProgressive ? 'ادامه' : 'نمایش کامل' }}
        </button>
      </div>
    </template>

    <p v-else ref="dialogueCopyRef" class="dialogue-copy">
      <template v-if="debugMode">
        <span
          v-for="(segment, index) in proofreadingRenderSegments"
          :key="`proofreading-${index}`"
          :class="{ 'proofreading-change': segment.changed }"
        >{{ segment.text }}</span>
      </template>
      <template v-else>
        <template v-for="(segment, index) in renderSegments" :key="index">
          <span v-if="segment.type === 'speech'">{{ segment.text }}</span>
          <RehearsalRevealText
            v-else
            :text="segment.text"
            :active="narratorOwnRehearsal"
            :reveal-mode="revealMode"
            class="inline-direction narrator-segment"
            :class="{ 'narrator-highlighted': narratorHighlighted, 'narrator-mine': narratorIsMine }"
            :style="narratorHighlighted || narratorIsMine ? { '--narrator-highlight': narratorColor } : undefined"
          />
        </template>
      </template>
    </p>
  </article>
</template>
