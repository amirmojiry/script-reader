<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CharacterPanel from '../components/CharacterPanel.vue'
import DialogueBlockView from '../components/DialogueBlock.vue'
import ProofreadingEditor from '../components/ProofreadingEditor.vue'
import ReaderToolbar from '../components/ReaderToolbar.vue'
import RehearsalRevealText from '../components/RehearsalRevealText.vue'
import {
  clearProofreadingCorrections,
  deleteNote,
  getReadingState,
  getSettings,
  listBookmarks,
  listNotes,
  listProofreadingCorrections,
  replaceProofreadingCorrectionsForBlock,
  saveNote,
  saveProofreadingCorrection,
  saveReadingState,
  saveSettings,
  toggleBookmark
} from '../services/storage'
import { canSpeak, speak, stopSpeaking } from '../services/speech'
import { releaseWakeLock, requestWakeLock, wakeLockSupported } from '../services/wakeLock'
import { usePlaysStore } from '../stores/plays'
import type { Character, DialogueBlock, NoteRecord, PlayBlock, ProofreadingCorrection, ReaderMode, ReaderSettings } from '../types'
import { playLibraryMetrics } from '../utils/library'
import {
  DEFAULT_NARRATOR_COLOR,
  analyzeNarrator,
  analyzePlay,
  blockText,
  dialogueCharacterIds,
  dialogueRenderSegments,
  flattenBlocks,
  playAuthors,
  playTranslators
} from '../utils/play'
import {
  automaticReadingSegments,
  automaticReadingStartIndex,
  isBlockVisible,
  isCharacterSpeechBlock,
  rehearsalCueIndexes,
  rehearsalCueIndexesForOwnIndexes,
  searchBlockIndexes,
  visibleBlockIndexes,
  visibleOwnedIndexes
} from '../utils/reader'
import {
  applyProofreadingCorrections,
  correctionClipboardText,
  proofreadingCorrectionsForBlock,
  proofreadingDisplaySegments,
  serializeProofreadingExport
} from '../utils/proofreading'
import { makePairKey } from '../utils/storageKey'

const defaultSettings: ReaderSettings = {
  fontSize: 17,
  lineHeight: 1.9,
  font: 'system',
  theme: 'light',
  hideStageDirections: false,
  keepAwake: false,
  rehearsalRevealMode: 'hidden',
  rehearsalCueOnly: false
}

function defaultSidebarOpen(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return !window.matchMedia('(max-width: 980px)').matches
}

const route = useRoute()
const router = useRouter()
const store = usePlaysStore()
const selected = ref<string[]>([])
const myCharacterId = ref<string>()
const narratorSelected = ref(false)
const narratorIsMine = ref(false)
const narratorColor = ref(DEFAULT_NARRATOR_COLOR)
const mode = ref<ReaderMode>('read')
const currentIndex = ref(0)
const sidebarOpen = ref(defaultSidebarOpen())
const sceneNavOpen = ref(defaultSidebarOpen())
const sceneNavManuallyToggled = ref(false)
const lineToolsOpen = ref(true)
const lineToolsManuallyToggled = ref(false)
const toolbarOpen = ref(true)
const toolbarManuallyToggled = ref(false)
const readerRootRef = ref<HTMLElement | null>(null)
const readerHeaderRef = ref<HTMLElement | null>(null)
const readerTitleBlockRef = ref<HTMLElement | null>(null)
const readerTitleRef = ref<HTMLHeadingElement | null>(null)
const rolesOpenButtonRef = ref<HTMLButtonElement | null>(null)
const settings = ref<ReaderSettings>({ ...defaultSettings })
const searchQuery = ref('')
const notes = ref<NoteRecord[]>([])
const noteText = ref('')
const bookmarkIds = ref<Set<string>>(new Set())
const statusMessage = ref('')
const showBackToTop = ref(false)
const readerHeaderScrolled = ref(false)
const readerHeaderHeight = ref(0)
const readerTitleFontSize = ref(28)
const readerTitleWrap = ref(false)
let readerTitleResizeObserver: ResizeObserver | undefined
let readerHeaderResizeObserver: ResizeObserver | undefined
let lastReaderTitleWidth = 0
let readerFontsReady = false
const proofreadingMode = ref(false)
const proofreadingSaving = ref(false)
let proofreadingTrigger: HTMLElement | null = null
const proofreadingCorrections = ref<ProofreadingCorrection[]>([])
const proofreadingDraft = ref<{
  blockId: string
  blockIndex: number
  blockType: PlayBlock['type']
  dialogueNumber?: number
  originalOffset: number
  sourceBlockText: string
  label: string
  originalText: string
  text: string
} | null>(null)

const play = computed(() => store.byId(String(route.params.id)))
const playMetrics = computed(() => play.value ? playLibraryMetrics(play.value) : null)
const authorLabel = computed(() => play.value ? playAuthors(play.value).join(' / ') : '')
const translatorLabel = computed(() => play.value ? playTranslators(play.value).join(' / ') : '')
const blocks = computed(() => play.value ? flattenBlocks(play.value) : [])
const blockStructure = computed(() => {
  const structure = new Map<string, { actId: string; actTitle: string; sceneId: string; sceneTitle: string }>()
  if (!play.value) return structure
  for (const act of play.value.acts) {
    for (const scene of act.scenes) {
      for (const block of scene.blocks) {
        structure.set(block.id, {
          actId: act.id,
          actTitle: act.title,
          sceneId: scene.id,
          sceneTitle: scene.title
        })
      }
    }
  }
  return structure
})
const stats = computed(() => play.value ? analyzePlay(play.value) : {})
const narratorStats = computed(() => play.value ? analyzeNarrator(play.value) : {
  dialogueCount: 0,
  wordCount: 0,
  shareOfWords: 0,
  estimatedMinutes: 0,
  blockIndexes: []
})
const narratorOwnedIndexes = computed(() => visibleOwnedIndexes(
  blocks.value,
  narratorStats.value.blockIndexes,
  settings.value.hideStageDirections
))
const characterMap = computed(() => new Map(play.value?.characters.map((character) => [character.id, character]) ?? []))
const currentBlock = computed(() => blocks.value[currentIndex.value])
const currentBookmarked = computed(() => Boolean(currentBlock.value && bookmarkIds.value.has(currentBlock.value.id)))
const hasMyRole = computed(() => Boolean(myCharacterId.value || narratorIsMine.value))
const myRoleLabel = computed(() => {
  if (narratorIsMine.value) return 'راوی'
  if (myCharacterId.value) return characterMap.value.get(myCharacterId.value)?.name ?? ''
  return ''
})
const fontFamily = computed(() => {
  if (settings.value.font === 'serif') return 'Georgia, "Times New Roman", serif'
  if (settings.value.font === 'sans') return 'Arial, Tahoma, sans-serif'
  return 'Tahoma, Arial, sans-serif'
})
const searchIndexes = computed(() =>
  searchBlockIndexes(
    blocks.value,
    searchQuery.value,
    proofreadingMode.value ? false : settings.value.hideStageDirections
  )
)
const readerEntries = computed(() => {
  const all = blocks.value.map((block, index) => ({ block, index }))
  if (proofreadingMode.value || mode.value !== 'rehearsal' || !settings.value.rehearsalCueOnly) return all

  if (narratorIsMine.value) {
    const indexes = new Set(rehearsalCueIndexesForOwnIndexes(
      blocks.value,
      narratorOwnedIndexes.value,
      currentIndex.value,
      searchIndexes.value
    ))
    return all.filter(({ index }) => indexes.has(index))
  }

  if (!myCharacterId.value) return all
  const indexes = new Set(rehearsalCueIndexes(blocks.value, myCharacterId.value, currentIndex.value, searchIndexes.value))
  return all.filter(({ index }) => indexes.has(index))
})
const readerEntryHeadings = computed(() => {
  const headings = new Map<string, { actTitle?: string; sceneTitle: string }>()
  const seenScenes = new Set<string>()
  const seenActs = new Set<string>()
  const multipleActs = (play.value?.acts.length ?? 0) > 1

  for (const entry of readerEntries.value) {
    if (!visible(entry.block)) continue
    const location = blockStructure.value.get(entry.block.id)
    if (!location || seenScenes.has(location.sceneId)) continue

    seenScenes.add(location.sceneId)
    const firstVisibleSceneInAct = !seenActs.has(location.actId)
    seenActs.add(location.actId)
    headings.set(entry.block.id, {
      ...(multipleActs && firstVisibleSceneInAct ? { actTitle: location.actTitle } : {}),
      sceneTitle: location.sceneTitle
    })
  }

  return headings
})
const tableReadIndexes = computed(() => visibleBlockIndexes(blocks.value, settings.value.hideStageDirections))
const tableReadPosition = computed(() => tableReadIndexes.value.indexOf(currentIndex.value))
const tableDialogueSegments = computed(() =>
  currentBlock.value?.type === 'dialogue' ? dialogueRenderSegments(currentBlock.value) : []
)
const dialogueNumbers = computed(() => {
  const numbers = new Map<string, number>()
  let dialogueNumber = 0
  for (const block of blocks.value) {
    if (block.type !== 'dialogue') continue
    dialogueNumber += 1
    numbers.set(block.id, dialogueNumber)
  }
  return numbers
})
const proofreadingCanRevertCurrent = computed(() => {
  const draft = proofreadingDraft.value
  if (!draft) return false
  return proofreadingCorrectionsForBlock(proofreadingCorrections.value, draft.blockId).length > 0
    || draft.text !== draft.originalText
})
onMounted(async () => {
  updateBackToTopVisibility()
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })

  await store.initialize()
  if (!play.value) {
    await router.replace('/')
    return
  }

  const storedSettings = await getSettings()
  if (storedSettings) settings.value = { ...defaultSettings, ...storedSettings }

  const state = await getReadingState(play.value.id)
  if (state) {
    selected.value = state.selectedCharacterIds
    myCharacterId.value = state.myCharacterId
    narratorSelected.value = state.narratorSelected ?? false
    narratorIsMine.value = state.narratorIsMine ?? false
    narratorColor.value = state.narratorColor ?? DEFAULT_NARRATOR_COLOR
    if (narratorIsMine.value) myCharacterId.value = undefined
    mode.value = state.mode
    const index = state.currentBlockId ? blocks.value.findIndex((block) => block.id === state.currentBlockId) : 0
    currentIndex.value = Math.max(0, index)
  }

  notes.value = await listNotes(play.value.id)
  bookmarkIds.value = new Set(await listBookmarks(play.value.id))
  proofreadingCorrections.value = await listProofreadingCorrections(play.value.id)
  syncNoteText()
  await nextTick()
  setupReaderTitleResizeObserver()
  setupReaderHeaderResizeObserver()
  await fitReaderTitle()
  void refitReaderTitleAfterFontsReady()
  if (mode.value === 'rehearsal' && narratorIsMine.value && !narratorOwnedIndexes.value.includes(currentIndex.value)) {
    jumpToNearestOwnRolePart()
  }
  if (mode.value === 'table-read') ensureCurrentTableReadVisible()
  if (settings.value.keepAwake) await requestWakeLock()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateBackToTopVisibility)
  readerTitleResizeObserver?.disconnect()
  readerHeaderResizeObserver?.disconnect()
  stopSpeaking()
  void releaseWakeLock()
})

watch([selected, myCharacterId, narratorSelected, narratorIsMine, narratorColor, mode, currentIndex], async () => {
  if (!play.value) return
  await saveReadingState({
    playId: play.value.id,
    currentBlockId: currentBlock.value?.id,
    selectedCharacterIds: selected.value,
    myCharacterId: myCharacterId.value,
    narratorSelected: narratorSelected.value,
    narratorIsMine: narratorIsMine.value,
    narratorColor: narratorColor.value,
    mode: mode.value
  })
}, { deep: true })

watch(() => currentBlock.value?.id, () => syncNoteText())
watch(() => play.value?.title, () => { void fitReaderTitle() })
watch(sidebarOpen, () => { void fitReaderTitle() })

function syncNoteText(): void {
  const blockId = currentBlock.value?.id
  noteText.value = blockId ? notes.value.find((note) => note.blockId === blockId)?.text ?? '' : ''
}

async function updateSettings(next: ReaderSettings) {
  const previousKeepAwake = settings.value.keepAwake
  settings.value = next
  await saveSettings(next)
  if (mode.value === 'rehearsal' && narratorIsMine.value && !narratorOwnedIndexes.value.includes(currentIndex.value)) {
    jumpToNearestOwnRolePart()
  }
  if (mode.value === 'table-read') ensureCurrentTableReadVisible()
  if (next.keepAwake && !previousKeepAwake) await requestWakeLock()
  if (!next.keepAwake && previousKeepAwake) await releaseWakeLock()
}

function setMode(next: ReaderMode): void {
  if (next !== 'read' && proofreadingMode.value) {
    proofreadingMode.value = false
    proofreadingDraft.value = null
    statusMessage.value = next === 'table-read'
      ? 'حالت عیب‌یابی برای نمایشنامه‌خوانی بسته شد.'
      : 'حالت عیب‌یابی برای تمرین بسته شد.'
  }
  mode.value = next
  if (next === 'rehearsal' && hasMyRole.value) jumpToNearestOwnRolePart()
  if (next === 'table-read') ensureCurrentTableReadVisible()
}

function toggleCharacter(id: string) {
  selected.value = selected.value.includes(id) ? selected.value.filter((item) => item !== id) : [...selected.value, id]
}

function chooseMine(id: string) {
  resetAutomaticReadingResume()
  const next = myCharacterId.value === id ? undefined : id
  myCharacterId.value = next
  if (next) narratorIsMine.value = false
  if (next && mode.value === 'rehearsal') jumpToNearestOwnRolePart()
}

async function openRolesPanel(): Promise<void> {
  sidebarOpen.value = true
  await nextTick()
  readerRootRef.value?.querySelector<HTMLButtonElement>('.panel-close-button')?.focus()
}

async function closeRolesPanel(): Promise<void> {
  sidebarOpen.value = false
  await nextTick()
  rolesOpenButtonRef.value?.focus()
}

function setupReaderHeaderResizeObserver(): void {
  readerHeaderResizeObserver?.disconnect()
  const header = readerHeaderRef.value
  if (!header) return

  const updateHeight = () => {
    readerHeaderHeight.value = header.offsetHeight
  }
  updateHeight()

  if (typeof ResizeObserver === 'undefined') return
  readerHeaderResizeObserver = new ResizeObserver(updateHeight)
  readerHeaderResizeObserver.observe(header)
}

async function refitReaderTitleAfterFontsReady(): Promise<void> {
  if (readerFontsReady || typeof document === 'undefined' || !('fonts' in document)) return
  readerFontsReady = true
  try {
    await document.fonts.ready
    await fitReaderTitle()
  } catch {
    // Font loading support is optional; the initial/resize fits remain in place.
  }
}

function setupReaderTitleResizeObserver(): void {
  readerTitleResizeObserver?.disconnect()
  if (typeof ResizeObserver === 'undefined' || !readerTitleBlockRef.value) return
  readerTitleResizeObserver = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width ?? 0
    if (width && Math.abs(width - lastReaderTitleWidth) < 0.5) return
    lastReaderTitleWidth = width
    void fitReaderTitle()
  })
  readerTitleResizeObserver.observe(readerTitleBlockRef.value)
}

async function fitReaderTitle(): Promise<void> {
  const title = readerTitleRef.value
  if (!title) return

  readerTitleWrap.value = false
  readerTitleFontSize.value = 28
  await nextTick()

  const available = title.clientWidth
  const required = title.scrollWidth
  if (!available || !required || required <= available) return

  const fitted = Math.max(16, Math.floor(28 * available / required))
  readerTitleFontSize.value = fitted
  await nextTick()
  readerTitleWrap.value = title.scrollWidth > title.clientWidth + 1
}

function updateBackToTopVisibility(): void {
  const scrolled = window.scrollY > 8
  showBackToTop.value = window.scrollY > 480
  readerHeaderScrolled.value = scrolled
  const desktop = typeof window.matchMedia !== 'function' || !window.matchMedia('(max-width: 980px)').matches
  if (!sceneNavManuallyToggled.value) sceneNavOpen.value = desktop && !scrolled
  if (!lineToolsManuallyToggled.value) lineToolsOpen.value = !scrolled
  if (!toolbarManuallyToggled.value) toolbarOpen.value = !scrolled
}

function closeOtherFloatingPanels(panel: 'scene' | 'line' | 'toolbar'): void {
  if (!readerHeaderScrolled.value) return
  if (panel !== 'scene') sceneNavOpen.value = false
  if (panel !== 'line') lineToolsOpen.value = false
  if (panel !== 'toolbar') toolbarOpen.value = false
}

function toggleSceneNav(): void {
  sceneNavManuallyToggled.value = true
  const next = !sceneNavOpen.value
  if (next) closeOtherFloatingPanels('scene')
  sceneNavOpen.value = next
}

function toggleLineTools(): void {
  lineToolsManuallyToggled.value = true
  const next = !lineToolsOpen.value
  if (next) closeOtherFloatingPanels('line')
  lineToolsOpen.value = next
}

function toggleToolbar(): void {
  toolbarManuallyToggled.value = true
  const next = !toolbarOpen.value
  if (next) closeOtherFloatingPanels('toolbar')
  toolbarOpen.value = next
}

function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function toggleProofreadingMode(): void {
  proofreadingMode.value = !proofreadingMode.value
  proofreadingDraft.value = null
  if (proofreadingMode.value) {
    setMode('read')
    statusMessage.value = 'حالت عیب‌یابی فعال شد؛ بخشی از متن را انتخاب کنید یا روی یک بخش کلیک کنید.'
  } else {
    statusMessage.value = 'حالت عیب‌یابی بسته شد.'
  }
}

interface ProofreadingSelection {
  text: string
  offset: number
}

function selectedTextWithin(target: EventTarget | null): ProofreadingSelection | undefined {
  if (!proofreadingMode.value || !(target instanceof HTMLElement) || typeof window === 'undefined') return undefined
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return undefined
  const range = selection.getRangeAt(0)
  const node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer as Element
    : range.commonAncestorContainer.parentElement
  if (!node || !target.contains(node)) return undefined

  const rawText = selection.toString()
  const text = rawText.trim()
  if (!text) return undefined
  const leadingTrim = rawText.length - rawText.trimStart().length

  const prefixRange = document.createRange()
  prefixRange.selectNodeContents(target)
  prefixRange.setEnd(range.startContainer, range.startOffset)
  return { text, offset: prefixRange.toString().length + leadingTrim }
}

function proofreadingLocation(block: PlayBlock, index: number): { dialogueNumber?: number; label: string } {
  const dialogueNumber = dialogueNumbers.value.get(block.id)
  if (dialogueNumber) return { dialogueNumber, label: `دیالوگ شماره ${dialogueNumber}` }
  if (block.type === 'stage-direction') return { label: `توضیح صحنه، بخش ${index + 1}` }
  return { label: `عنوان بخش ${index + 1}` }
}

function proofreadingBlockCorrections(blockId: string): ProofreadingCorrection[] {
  return proofreadingCorrectionsForBlock(proofreadingCorrections.value, blockId)
}

function proofreadingDisplayCorrections(block: PlayBlock): ProofreadingCorrection[] {
  const corrections = proofreadingBlockCorrections(block.id)
  const draft = proofreadingDraft.value
  if (!draft || draft.blockId !== block.id || draft.text === draft.originalText) return corrections

  if (!draft.originalText && corrections.length > 0) {
    return [{
      id: 'preview',
      playId: play.value?.id ?? '',
      playTitle: play.value?.title ?? '',
      blockId: block.id,
      blockIndex: draft.blockIndex,
      blockType: block.type,
      ...(draft.dialogueNumber ? { dialogueNumber: draft.dialogueNumber } : {}),
      originalOffset: 0,
      sourceBlockText: blockText(block),
      originalText: blockText(block),
      correctedText: draft.text,
      createdAt: '9999-12-31T23:59:59.999Z'
    }]
  }

  return [...corrections, {
    id: 'preview',
    playId: play.value?.id ?? '',
    playTitle: play.value?.title ?? '',
    blockId: block.id,
    blockIndex: draft.blockIndex,
    blockType: block.type,
    ...(draft.dialogueNumber ? { dialogueNumber: draft.dialogueNumber } : {}),
    originalOffset: draft.originalOffset,
    sourceBlockText: draft.sourceBlockText,
    originalText: draft.originalText,
    correctedText: draft.text,
    createdAt: '9999-12-31T23:59:59.999Z'
  }]
}

function effectiveProofreadingText(block: PlayBlock): string {
  return applyProofreadingCorrections(blockText(block), proofreadingDisplayCorrections(block))
}

function proofreadingSegmentsForBlock(block: PlayBlock) {
  const corrections = proofreadingDisplayCorrections(block)
  if (corrections.length === 0) return undefined
  return proofreadingDisplaySegments(blockText(block), corrections)
}

function adjacentProofreadingIndex(index: number, direction: -1 | 1): number | undefined {
  for (let next = index + direction; next >= 0 && next < blocks.value.length; next += direction) {
    if (blockText(blocks.value[next]).trim()) return next
  }
  return undefined
}

function openProofreading(block: PlayBlock, index: number, selectedText: string, originalOffset = 0): void {
  if (!proofreadingMode.value || proofreadingSaving.value) return
  const currentDraft = proofreadingDraft.value
  if (currentDraft && currentDraft.text !== currentDraft.originalText) return
  if (!selectedText.trim() && proofreadingBlockCorrections(block.id).length === 0) return
  const text = selectedText
  const sourceBlockText = effectiveProofreadingText(block)
  currentIndex.value = index
  proofreadingTrigger = document.getElementById(`block-${block.id}`)
  const location = proofreadingLocation(block, index)
  proofreadingDraft.value = {
    blockId: block.id,
    blockIndex: index + 1,
    blockType: block.type,
    dialogueNumber: location.dialogueNumber,
    originalOffset,
    sourceBlockText,
    label: location.label,
    originalText: text,
    text
  }
}

function proofreadingSourceTarget(block: PlayBlock, eventTarget: EventTarget | null): HTMLElement | null {
  if (!(eventTarget instanceof HTMLElement)) return null
  if (block.type === 'stage-direction') {
    return eventTarget.querySelector<HTMLElement>('.proofreading-block-copy, .narrator-rehearsal-text')
  }
  return eventTarget
}

function captureProofreadingSelection(block: PlayBlock, index: number, event: MouseEvent): void {
  const selected = selectedTextWithin(proofreadingSourceTarget(block, event.currentTarget))
  if (selected) openProofreading(block, index, selected.text, selected.offset)
}

function handleProofreadingBlockClick(block: PlayBlock, index: number, event: MouseEvent): void {
  selectCurrent(index)
  if (!proofreadingMode.value) return
  if (!selectedTextWithin(proofreadingSourceTarget(block, event.currentTarget))) {
    openProofreading(block, index, effectiveProofreadingText(block), 0)
  }
}

function handleProofreadingKeyboard(block: PlayBlock, index: number): void {
  if (!proofreadingMode.value) return
  selectCurrent(index)
  openProofreading(block, index, effectiveProofreadingText(block), 0)
}

async function clearProofreadingDraftAndRestoreFocus(): Promise<void> {
  const trigger = proofreadingTrigger
  proofreadingDraft.value = null
  proofreadingTrigger = null
  await nextTick()
  trigger?.focus()
}

function previewProofreadingDraft(text: string): void {
  if (!proofreadingDraft.value || proofreadingSaving.value) return
  proofreadingDraft.value = { ...proofreadingDraft.value, text }
}

async function cancelProofreadingDraft(): Promise<void> {
  if (proofreadingSaving.value) return
  await clearProofreadingDraftAndRestoreFocus()
}

function makeCorrectionId(): string {
  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${play.value?.id ?? 'play'}:${proofreadingDraft.value?.blockId ?? 'block'}:${suffix}`
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

async function moveProofreadingDraft(direction: -1 | 1): Promise<void> {
  if (!proofreadingDraft.value) return
  const currentIndex = proofreadingDraft.value.blockIndex - 1
  const targetIndex = adjacentProofreadingIndex(currentIndex, direction) ?? currentIndex
  const target = blocks.value[targetIndex]

  proofreadingDraft.value = null
  await jump(targetIndex)
  openProofreading(target, targetIndex, effectiveProofreadingText(target), 0)
}

async function saveProofreadingDraft(correctedText: string, direction: -1 | 1): Promise<void> {
  if (proofreadingSaving.value || !play.value || !proofreadingDraft.value) return
  const draft = proofreadingDraft.value

  if (correctedText === draft.originalText) {
    await moveProofreadingDraft(direction)
    return
  }

  const block = blocks.value[draft.blockIndex - 1]
  const replacesFullyDeletedBlock = !draft.originalText
    && Boolean(block)
    && proofreadingBlockCorrections(draft.blockId).length > 0

  if (replacesFullyDeletedBlock && block) {
    proofreadingSaving.value = true
    try {
      const sourceText = blockText(block)
      let replacement: ProofreadingCorrection | undefined
      let clipboardPromise: Promise<boolean> | undefined

      if (correctedText !== sourceText) {
        replacement = {
          id: makeCorrectionId(),
          playId: play.value.id,
          playTitle: play.value.title,
          blockId: draft.blockId,
          blockIndex: draft.blockIndex,
          blockType: draft.blockType,
          ...(draft.dialogueNumber ? { dialogueNumber: draft.dialogueNumber } : {}),
          originalOffset: 0,
          sourceBlockText: sourceText,
          originalText: sourceText,
          correctedText,
          createdAt: new Date().toISOString()
        }
        clipboardPromise = writeClipboard(correctionClipboardText(replacement))
      }

      await replaceProofreadingCorrectionsForBlock(play.value.id, draft.blockId, replacement)

      proofreadingCorrections.value = proofreadingCorrections.value.filter((item) => item.blockId !== draft.blockId)
      if (replacement) {
        proofreadingCorrections.value = [...proofreadingCorrections.value, replacement]
          .sort((a, b) => a.blockIndex - b.blockIndex || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
        const copied = await clipboardPromise
        statusMessage.value = copied
          ? 'اصلاح ذخیره و در کلیپ‌بورد کپی شد.'
          : 'اصلاح ذخیره شد، اما دسترسی به کلیپ‌بورد ممکن نبود.'
      } else {
        statusMessage.value = 'تغییرات این بخش به متن اصلی برگردانده شد.'
      }

      proofreadingSaving.value = false
      await moveProofreadingDraft(direction)
    } catch {
      statusMessage.value = 'ذخیرهٔ اصلاح ناموفق بود؛ تغییر قبلی حفظ شد.'
    } finally {
      proofreadingSaving.value = false
    }
    return
  }

  proofreadingSaving.value = true
  const correction: ProofreadingCorrection = {
    id: makeCorrectionId(),
    playId: play.value.id,
    playTitle: play.value.title,
    blockId: draft.blockId,
    blockIndex: draft.blockIndex,
    blockType: draft.blockType,
    ...(draft.dialogueNumber ? { dialogueNumber: draft.dialogueNumber } : {}),
    originalOffset: draft.originalOffset,
    sourceBlockText: draft.sourceBlockText,
    originalText: draft.originalText,
    correctedText,
    createdAt: new Date().toISOString()
  }

  try {
    const clipboardPromise = writeClipboard(correctionClipboardText(correction))
    await saveProofreadingCorrection(correction)
    proofreadingCorrections.value = [...proofreadingCorrections.value, correction]
      .sort((a, b) => a.blockIndex - b.blockIndex || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))

    const copied = await clipboardPromise
    statusMessage.value = copied
      ? 'اصلاح ذخیره و در کلیپ‌بورد کپی شد.'
      : 'اصلاح ذخیره شد، اما دسترسی به کلیپ‌بورد ممکن نبود.'
    proofreadingSaving.value = false
    await moveProofreadingDraft(direction)
  } finally {
    proofreadingSaving.value = false
  }
}

async function revertCurrentProofreadingBlock(): Promise<void> {
  if (proofreadingSaving.value || !play.value || !proofreadingDraft.value) return
  proofreadingSaving.value = true
  const draft = proofreadingDraft.value

  try {
    await replaceProofreadingCorrectionsForBlock(play.value.id, draft.blockId)
    proofreadingCorrections.value = proofreadingCorrections.value
      .filter((correction) => correction.blockId !== draft.blockId)
    proofreadingDraft.value = null
    proofreadingSaving.value = false

    const block = blocks.value[draft.blockIndex - 1]
    if (block) openProofreading(block, draft.blockIndex - 1, blockText(block))
    statusMessage.value = 'تغییرات این بخش به متن اصلی برگردانده شد.'
  } catch {
    statusMessage.value = 'برگرداندن تغییرات ناموفق بود؛ تغییر قبلی حفظ شد.'
  } finally {
    proofreadingSaving.value = false
  }
}

async function revertAllProofreadingCorrections(): Promise<void> {
  if (proofreadingSaving.value || !play.value || proofreadingCorrections.value.length === 0) return
  if (!window.confirm('همهٔ تغییرات عیب‌یابی این نمایشنامه به متن اصلی برگردانده شوند؟')) return

  proofreadingSaving.value = true
  try {
    await clearProofreadingCorrections(play.value.id)
    proofreadingCorrections.value = []
    const draft = proofreadingDraft.value
    proofreadingDraft.value = null
    proofreadingSaving.value = false

    if (draft) {
      const block = blocks.value[draft.blockIndex - 1]
      if (block) openProofreading(block, draft.blockIndex - 1, blockText(block))
    }
    statusMessage.value = 'همهٔ تغییرات عیب‌یابی به متن اصلی برگردانده شدند.'
  } catch {
    statusMessage.value = 'برگرداندن همهٔ تغییرات ناموفق بود؛ تغییرات قبلی حفظ شدند.'
  } finally {
    proofreadingSaving.value = false
  }
}

async function copyAllProofreadingCorrections(): Promise<void> {
  if (!play.value || proofreadingCorrections.value.length === 0) return
  const copied = await writeClipboard(serializeProofreadingExport(play.value, proofreadingCorrections.value))
  statusMessage.value = copied ? 'گزارش کامل عیب‌ها در کلیپ‌بورد کپی شد.' : 'کپی گزارش در کلیپ‌بورد ناموفق بود.'
}

function downloadProofreadingCorrections(): void {
  if (!play.value || proofreadingCorrections.value.length === 0) return
  const blob = new Blob([serializeProofreadingExport(play.value, proofreadingCorrections.value)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${play.value.id}-proofreading.json`
  link.click()
  URL.revokeObjectURL(url)
  statusMessage.value = 'فایل گزارش عیب‌ها آماده شد.'
}

function toggleNarrator(): void {
  narratorSelected.value = !narratorSelected.value
}

function chooseNarratorMine(): void {
  resetAutomaticReadingResume()
  narratorIsMine.value = !narratorIsMine.value
  if (narratorIsMine.value) {
    myCharacterId.value = undefined
    narratorSelected.value = true
    if (mode.value === 'rehearsal') jumpToNearestOwnRolePart()
  }
}

function changeNarratorColor(color: string): void {
  narratorColor.value = color
}

async function changeCharacterColor(characterId: string, color: string): Promise<void> {
  if (!play.value) return
  await store.updateCharacterColor(play.value.id, characterId, color)
}

async function jump(index: number) {
  if (blocks.value.length === 0 || index < 0) return
  resetAutomaticReadingResume()
  currentIndex.value = Math.max(0, Math.min(index, blocks.value.length - 1))
  await nextTick()
  document.getElementById(`block-${blocks.value[currentIndex.value]?.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function jumpToScene(blockId?: string): Promise<void> {
  if (!blockId) return
  const index = blocks.value.findIndex((block) => block.id === blockId)
  if (index < 0) return
  sceneNavOpen.value = false
  sceneNavManuallyToggled.value = true
  await nextTick()
  await jump(index)
}

function ownRoleIndexes(): number[] {
  if (narratorIsMine.value) return narratorOwnedIndexes.value
  if (!myCharacterId.value) return []
  return stats.value[myCharacterId.value]?.blockIndexes ?? []
}

function jumpToNearestOwnRolePart(): void {
  const indexes = ownRoleIndexes()
  const target = indexes.find((index) => index >= currentIndex.value) ?? indexes[0]
  if (target !== undefined) void jump(target)
}

function moveOwnRolePart(direction: -1 | 1) {
  const indexes = ownRoleIndexes()
  const target = direction > 0
    ? indexes.find((index) => index > currentIndex.value)
    : [...indexes].reverse().find((index) => index < currentIndex.value)
  if (target !== undefined) void jump(target)
}

let automaticReadingResume: { blockId: string; segmentIndex: number } | undefined

function resetAutomaticReadingResume(): void {
  automaticReadingResume = undefined
}

async function speakOtherRoles() {
  if (!myCharacterId.value || narratorIsMine.value || !canSpeak()) return
  stopSpeaking()

  let resume = automaticReadingResume
  if (resume && blocks.value[currentIndex.value]?.id !== resume.blockId) {
    resume = undefined
    automaticReadingResume = undefined
  }

  const startIndex = automaticReadingStartIndex(
    blocks.value,
    currentIndex.value,
    myCharacterId.value,
    Boolean(resume)
  )

  for (let i = startIndex; i < blocks.value.length; i += 1) {
    const block = blocks.value[i]
    if (block.type === 'section') continue
    if (block.type === 'stage-direction' && settings.value.hideStageDirections) continue

    currentIndex.value = i
    const segments = automaticReadingSegments(block, myCharacterId.value)
    const startSegment = resume?.blockId === block.id ? resume.segmentIndex : 0
    resume = undefined
    automaticReadingResume = undefined

    for (let segmentIndex = startSegment; segmentIndex < segments.length; segmentIndex += 1) {
      const segment = segments[segmentIndex]
      if (segment.action === 'pause-for-character') {
        automaticReadingResume = { blockId: block.id, segmentIndex: segmentIndex + 1 }
        return
      }
      await speak(segment.text)
    }
  }
}

function exportPlay() {
  if (!play.value) return
  const blob = new Blob([JSON.stringify(play.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${play.value.id}.json`
  link.click()
  URL.revokeObjectURL(url)
}

async function toggleCurrentBookmark() {
  if (!play.value || !currentBlock.value) return
  const next = !currentBookmarked.value
  await toggleBookmark(play.value.id, currentBlock.value.id, next)
  const updated = new Set(bookmarkIds.value)
  if (next) updated.add(currentBlock.value.id)
  else updated.delete(currentBlock.value.id)
  bookmarkIds.value = updated
  statusMessage.value = next ? 'نشانک ذخیره شد.' : 'نشانک حذف شد.'
}

async function saveCurrentNote() {
  if (!play.value || !currentBlock.value) return
  const id = makePairKey(play.value.id, currentBlock.value.id)
  const existing = notes.value.find((note) => note.playId === play.value?.id && note.blockId === currentBlock.value?.id)
  const text = noteText.value.trim()

  if (!text) {
    if (existing) {
      await deleteNote(existing.id)
      notes.value = notes.value.filter((note) => note.id !== existing.id)
      statusMessage.value = 'یادداشت حذف شد.'
    }
    return
  }

  if (existing && existing.id !== id) await deleteNote(existing.id)

  const now = new Date().toISOString()
  const note: NoteRecord = {
    id,
    playId: play.value.id,
    blockId: currentBlock.value.id,
    text,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  }
  await saveNote(note)
  const index = notes.value.findIndex((item) => item.playId === play.value?.id && item.blockId === currentBlock.value?.id)
  if (index >= 0) notes.value[index] = note
  else notes.value.push(note)
  statusMessage.value = 'یادداشت ذخیره شد.'
}

function moveSearch(direction: -1 | 1): void {
  const indexes = searchIndexes.value
  if (indexes.length === 0) return
  const target = direction > 0
    ? indexes.find((index) => index > currentIndex.value) ?? indexes[0]
    : [...indexes].reverse().find((index) => index < currentIndex.value) ?? indexes[indexes.length - 1]
  void jump(target)
}

function ensureCurrentTableReadVisible(): void {
  const indexes = tableReadIndexes.value
  if (indexes.length === 0 || indexes.includes(currentIndex.value)) return
  const target = indexes.find((index) => index > currentIndex.value) ?? indexes[indexes.length - 1]
  if (target !== undefined) currentIndex.value = target
}

function moveTableRead(direction: -1 | 1): void {
  const indexes = tableReadIndexes.value
  if (indexes.length === 0) return
  const position = indexes.indexOf(currentIndex.value)
  if (position < 0) {
    ensureCurrentTableReadVisible()
    return
  }
  const target = indexes[position + direction]
  if (target !== undefined) void jump(target)
}

function visible(block: PlayBlock): boolean {
  return proofreadingMode.value || isBlockVisible(block, settings.value.hideStageDirections)
}

function dialogueCharacters(block: DialogueBlock): Character[] {
  return dialogueCharacterIds(block)
    .map((id) => characterMap.value.get(id))
    .filter((character): character is Character => Boolean(character))
}

function dialogueLabel(block: DialogueBlock): string {
  const names = dialogueCharacters(block).map((character) => character.name)
  return names.length > 0 ? names.join(' و ') : block.characterId
}

function dialogueHighlighted(block: DialogueBlock): boolean {
  return dialogueCharacterIds(block).some((id) => selected.value.includes(id))
}

function dialogueHighlightColor(block: DialogueBlock): string | undefined {
  const selectedOwnerId = dialogueCharacterIds(block).find((id) => selected.value.includes(id))
  return selectedOwnerId ? characterMap.value.get(selectedOwnerId)?.color : undefined
}

function isCurrent(index: number) {
  return index === currentIndex.value
}

function selectCurrent(index: number) {
  resetAutomaticReadingResume()
  currentIndex.value = index
}
</script>

<template>
  <main
    v-if="play"
    ref="readerRootRef"
    class="reader-layout"
    :class="{ 'sidebar-closed': !sidebarOpen, 'dark-theme': settings.theme === 'dark', 'proofreading-editing': Boolean(proofreadingDraft) }"
    :style="{ '--reader-font-size': `${settings.fontSize}px`, '--reader-line-height': settings.lineHeight, '--reader-font-family': fontFamily, '--reader-header-height': `${readerHeaderHeight}px` }"
  >
    <CharacterPanel
      v-if="sidebarOpen"
      :characters="play.characters"
      :stats="stats"
      :selected="selected"
      :my-character-id="myCharacterId"
      :narrator-stats="narratorStats"
      :narrator-jump-indexes="narratorOwnedIndexes"
      :narrator-selected="narratorSelected"
      :narrator-is-mine="narratorIsMine"
      :narrator-color="narratorColor"
      @close="closeRolesPanel"
      @toggle="toggleCharacter"
      @choose-mine="chooseMine"
      @toggle-narrator="toggleNarrator"
      @choose-narrator-mine="chooseNarratorMine"
      @change-color="changeCharacterColor"
      @change-narrator-color="changeNarratorColor"
      @jump="jump"
    />

    <section class="reader-main">
      <header ref="readerHeaderRef" class="reader-header card">
        <button class="text-button reader-library-link" @click="router.push('/')">← کتابخانه</button>
        <div ref="readerTitleBlockRef" class="reader-title-block">
          <h1
            ref="readerTitleRef"
            :class="{ 'reader-title-wrap': readerTitleWrap }"
            :style="{ fontSize: `${readerTitleFontSize}px` }"
          >{{ play.title }}</h1>
          <div v-show="!readerHeaderScrolled" class="reader-play-metadata" aria-label="مشخصات نمایشنامه">
            <span>نویسنده: {{ authorLabel || 'نامشخص' }}</span>
            <span v-if="translatorLabel">مترجم: {{ translatorLabel }}</span>
            <span>{{ playMetrics?.characterCount ?? play.characters.length }} شخصیت</span>
            <span>حدود {{ playMetrics?.estimatedMinutes ?? 0 }} دقیقه</span>
          </div>
        </div>
        <div class="header-actions reader-primary-actions">
          <button
            ref="rolesOpenButtonRef"
            class="icon-button reader-action-button reader-roles-button"
            type="button"
            :aria-label="sidebarOpen ? 'بستن نقش‌ها' : 'باز کردن نقش‌ها'"
            :title="sidebarOpen ? 'بستن نقش‌ها' : 'نقش‌ها'"
            @click="sidebarOpen ? closeRolesPanel() : openRolesPanel()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
          <button
            class="icon-button reader-action-button reader-panel-toggle reader-scene-nav-button"
            type="button"
            :class="{ active: sceneNavOpen }"
            :aria-pressed="sceneNavOpen"
            aria-controls="reader-scene-nav-panel"
            :aria-label="sceneNavOpen ? 'بستن فهرست صحنه‌ها' : 'باز کردن فهرست صحنه‌ها'"
            :title="sceneNavOpen ? 'بستن فهرست صحنه‌ها' : 'فهرست صحنه‌ها'"
            @click="toggleSceneNav"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14"/></svg>
          </button>
          <button
            class="icon-button reader-action-button reader-panel-toggle reader-line-tools-button"
            type="button"
            :class="{ active: lineToolsOpen }"
            :aria-pressed="lineToolsOpen"
            aria-controls="reader-line-tools-panel"
            :aria-label="lineToolsOpen ? 'بستن ابزار سطر جاری' : 'باز کردن ابزار سطر جاری'"
            :title="lineToolsOpen ? 'بستن ابزار سطر جاری' : 'ابزار سطر جاری'"
            @click="toggleLineTools"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h10M4 19h7M17 10l3 3-6 6H11v-3z"/></svg>
          </button>
          <button
            class="icon-button reader-action-button reader-panel-toggle reader-toolbar-button"
            type="button"
            :class="{ active: toolbarOpen }"
            :aria-pressed="toolbarOpen"
            aria-controls="reader-toolbar-panel"
            :aria-label="toolbarOpen ? 'بستن نوار ابزار خوانش' : 'باز کردن نوار ابزار خوانش'"
            :title="toolbarOpen ? 'بستن نوار ابزار خوانش' : 'نوار ابزار خوانش'"
            @click="toggleToolbar"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M7 14v6"/></svg>
          </button>
          <button
            class="icon-button reader-action-button"
            type="button"
            :class="{ active: currentBookmarked }"
            :aria-label="currentBookmarked ? 'حذف نشانک سطر جاری' : 'نشانک‌گذاری سطر جاری'"
            :title="currentBookmarked ? 'حذف نشانک' : 'نشانک'"
            @click="toggleCurrentBookmark"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>
          </button>
          <button
            class="icon-button reader-action-button reader-proofreading-button"
            type="button"
            :class="{ active: proofreadingMode }"
            :aria-pressed="proofreadingMode"
            aria-label="حالت عیب‌یابی متن"
            title="عیب‌یابی متن"
            @click="toggleProofreadingMode"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9h6M9 13h6M10 3h4l1 3h3v12H6V6h3l1-3zM4 10H2M22 10h-2M4 15H2M22 15h-2"/></svg>
          </button>
          <button
            class="icon-button reader-action-button"
            type="button"
            aria-label="خروجی JSON"
            title="خروجی JSON"
            @click="exportPlay"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 11l4 4 4-4M5 21h14"/></svg>
          </button>
          <RouterLink
            class="icon-button reader-action-button reader-settings-link"
            :to="{ name: 'settings', query: { from: 'reader', play: play.id } }"
            aria-label="تنظیمات"
            title="تنظیمات"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9.6h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1A1.7 1.7 0 0 0 19.4 15z"/></svg>
          </RouterLink>
        </div>
      </header>

      <ReaderToolbar
        v-show="toolbarOpen"
        id="reader-toolbar-panel"
        :class="{ 'reader-floating-panel': readerHeaderScrolled }"
        :mode="mode"
        :settings="settings"
        :wake-lock-available="wakeLockSupported()"
        :speech-available="canSpeak() && Boolean(myCharacterId) && !narratorIsMine"
        :search-query="searchQuery"
        :search-count="searchIndexes.length"
        @set-mode="setMode"
        @update-settings="updateSettings"
        @speak-others="speakOtherRoles"
        @update-search="searchQuery = $event"
        @search-next="moveSearch(1)"
        @search-previous="moveSearch(-1)"
      />

      <section v-if="proofreadingMode" class="proofreading-status card" aria-label="وضعیت عیب‌یابی">
        <div>
          <strong>حالت عیب‌یابی فعال است</strong>
          <span class="muted">{{ proofreadingCorrections.length }} عیب ثبت‌شده</span>
        </div>
        <div class="proofreading-status-actions">
          <button class="secondary-button" type="button" :disabled="!proofreadingCorrections.length" @click="copyAllProofreadingCorrections">کپی همه به‌صورت JSON</button>
          <button class="secondary-button" type="button" :disabled="!proofreadingCorrections.length" @click="downloadProofreadingCorrections">دانلود JSON</button>
          <button class="secondary-button danger-button" type="button" :disabled="!proofreadingCorrections.length" @click="revertAllProofreadingCorrections">برگردان همه</button>
        </div>
      </section>

      <div v-if="mode === 'rehearsal'" class="rehearsal-controls card">
        <button class="secondary-button" :disabled="!hasMyRole" @click="moveOwnRolePart(-1)">بخش قبلی نقش من</button>
        <span>{{ hasMyRole ? `تمرین نقش ${myRoleLabel}` : 'ابتدا «نقش من» را برای یک شخصیت یا راوی انتخاب کنید' }}</span>
        <button class="primary-button" :disabled="!hasMyRole" @click="moveOwnRolePart(1)">بخش بعدی نقش من</button>
      </div>

      <nav v-show="sceneNavOpen" id="reader-scene-nav-panel" class="scene-nav card" :class="{ 'reader-floating-panel': readerHeaderScrolled }" aria-label="صحنه‌ها">
        <template v-for="act in play.acts" :key="act.id">
          <strong>{{ act.title }}</strong>
          <button v-for="scene in act.scenes" :key="scene.id" class="text-button" @click="jumpToScene(scene.blocks[0]?.id)">{{ scene.title }}</button>
        </template>
      </nav>

      <section v-show="lineToolsOpen" id="reader-line-tools-panel" class="line-tools card" :class="{ 'reader-floating-panel': readerHeaderScrolled }" aria-label="ابزار سطر جاری">
        <div>
          <strong>سطر جاری: {{ currentIndex + 1 }} / {{ blocks.length }}</strong>
          <span v-if="statusMessage" class="status-message">{{ statusMessage }}</span>
        </div>
        <textarea v-model="noteText" rows="2" placeholder="یادداشت این سطر؛ مثلاً مکث، تأکید یا حرکت صحنه" />
        <button class="secondary-button" @click="saveCurrentNote">ذخیره یادداشت</button>
        <details v-if="bookmarkIds.size > 0">
          <summary>{{ bookmarkIds.size }} نشانک</summary>
          <div class="bookmark-list">
            <button
              v-for="blockId in bookmarkIds"
              :key="blockId"
              class="text-button"
              @click="jump(blocks.findIndex(block => block.id === blockId))"
            >
              سطر {{ blocks.findIndex(block => block.id === blockId) + 1 }}
            </button>
          </div>
        </details>
      </section>

      <section v-if="mode === 'table-read'" class="table-read card">
        <button class="nav-arrow" :disabled="tableReadPosition <= 0" @click="moveTableRead(-1)">→</button>
        <div v-if="currentBlock?.type === 'dialogue'">
          <p class="eyebrow">{{ dialogueLabel(currentBlock) }}</p>
          <p class="table-copy">
            <template v-for="(segment, index) in tableDialogueSegments" :key="index">
              <span v-if="segment.type === 'speech'">{{ segment.text }}</span>
              <em
                v-else
                class="inline-direction narrator-segment"
                :class="{ 'narrator-highlighted': narratorSelected, 'narrator-mine': narratorIsMine }"
                :style="narratorSelected || narratorIsMine ? { '--narrator-highlight': narratorColor } : undefined"
              >{{ segment.text }}</em>
            </template>
          </p>
        </div>
        <div
          v-else-if="currentBlock?.type === 'stage-direction' && visible(currentBlock)"
          class="stage-direction narrator-stage"
          :class="{ 'narrator-highlighted': narratorSelected, 'narrator-mine': narratorIsMine }"
          :style="narratorSelected || narratorIsMine ? { '--narrator-highlight': narratorColor } : undefined"
        >
          <span class="narrator-label">راوی</span>
          <RehearsalRevealText
            :text="currentBlock.text"
            :active="false"
            :reveal-mode="settings.rehearsalRevealMode"
          />
        </div>
        <div v-else-if="currentBlock?.type === 'section'">
          <p class="table-copy">{{ currentBlock.title }}</p>
        </div>
        <button class="nav-arrow" :disabled="tableReadPosition < 0 || tableReadPosition >= tableReadIndexes.length - 1" @click="moveTableRead(1)">←</button>
      </section>

      <section v-else class="reader-document">
        <template v-for="entry in readerEntries" :key="entry.block.id">
          <div v-if="readerEntryHeadings.get(entry.block.id)" class="reader-scene-heading" aria-label="عنوان بخش نمایش">
            <p v-if="readerEntryHeadings.get(entry.block.id)?.actTitle" class="reader-act-title">{{ readerEntryHeadings.get(entry.block.id)?.actTitle }}</p>
            <h2>{{ readerEntryHeadings.get(entry.block.id)?.sceneTitle }}</h2>
          </div>
          <DialogueBlockView
            v-if="entry.block.type === 'dialogue' && visible(entry.block)"
            :block="entry.block"
            :character="characterMap.get(entry.block.characterId)"
            :characters="dialogueCharacters(entry.block)"
            :mode="mode"
            :is-mine="isCharacterSpeechBlock(entry.block, myCharacterId)"
            :highlighted="dialogueHighlighted(entry.block)"
            :highlight-color="dialogueHighlightColor(entry.block)"
            :current="isCurrent(entry.index)"
            :reveal-mode="settings.rehearsalRevealMode"
            :narrator-highlighted="narratorSelected"
            :narrator-is-mine="narratorIsMine"
            :narrator-color="narratorColor"
            :debug-mode="proofreadingMode"
            :proofreading-segments="proofreadingMode ? proofreadingSegmentsForBlock(entry.block) : undefined"
            @proofread="(text, offset) => openProofreading(entry.block, entry.index, text, offset)"
            @click="selectCurrent(entry.index)"
          />
          <div
            v-else-if="entry.block.type === 'stage-direction' && visible(entry.block)"
            :id="`block-${entry.block.id}`"
            class="stage-direction narrator-stage"
            :class="{
              current: isCurrent(entry.index),
              'narrator-highlighted': narratorSelected,
              'narrator-mine': narratorIsMine,
              'proofreading-target': proofreadingMode
            }"
            :style="narratorSelected || narratorIsMine ? { '--narrator-highlight': narratorColor } : undefined"
            :tabindex="proofreadingMode ? 0 : undefined"
            :role="proofreadingMode ? 'button' : undefined"
            @mouseup="captureProofreadingSelection(entry.block, entry.index, $event)"
            @click="handleProofreadingBlockClick(entry.block, entry.index, $event)"
            @keydown.enter.prevent="handleProofreadingKeyboard(entry.block, entry.index)"
            @keydown.space.prevent="handleProofreadingKeyboard(entry.block, entry.index)"
          >
            <span class="narrator-label">راوی</span>
            <span v-if="proofreadingMode && proofreadingSegmentsForBlock(entry.block)" class="proofreading-block-copy">
              <span
                v-for="(segment, segmentIndex) in proofreadingSegmentsForBlock(entry.block)"
                :key="segmentIndex"
                :class="{ 'proofreading-change': segment.changed }"
              >{{ segment.text }}</span>
            </span>
            <RehearsalRevealText
              v-else
              :text="entry.block.text"
              :active="mode === 'rehearsal' && narratorIsMine"
              :reveal-mode="settings.rehearsalRevealMode"
            />
          </div>
          <h2
            v-else-if="entry.block.type === 'section'"
            :id="`block-${entry.block.id}`"
            :class="{ 'proofreading-target': proofreadingMode }"
            :tabindex="proofreadingMode ? 0 : undefined"
            :role="proofreadingMode ? 'button' : undefined"
            @mouseup="captureProofreadingSelection(entry.block, entry.index, $event)"
            @click="handleProofreadingBlockClick(entry.block, entry.index, $event)"
            @keydown.enter.prevent="handleProofreadingKeyboard(entry.block, entry.index)"
            @keydown.space.prevent="handleProofreadingKeyboard(entry.block, entry.index)"
          >
            <template v-if="proofreadingMode && proofreadingSegmentsForBlock(entry.block)">
              <span
                v-for="(segment, segmentIndex) in proofreadingSegmentsForBlock(entry.block)"
                :key="segmentIndex"
                :class="{ 'proofreading-change': segment.changed }"
              >{{ segment.text }}</span>
            </template>
            <template v-else>{{ entry.block.title }}</template>
          </h2>
        </template>
      </section>
    </section>

    <ProofreadingEditor
      v-if="proofreadingDraft"
      :draft="proofreadingDraft"
      :saving="proofreadingSaving"
      :can-revert="proofreadingCanRevertCurrent"
      @save="saveProofreadingDraft"
      @preview="previewProofreadingDraft"
      @revert="revertCurrentProofreadingBlock"
      @cancel="cancelProofreadingDraft"
    />

    <button
      v-if="showBackToTop"
      class="back-to-top-button icon-button"
      type="button"
      aria-label="برگشت به بالای صفحه"
      title="برگشت به بالا"
      @click="scrollToTop"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>
    </button>
  </main>
</template>
