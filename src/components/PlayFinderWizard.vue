<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Play } from '../types'
import {
  matchesWizardCriteria,
  playGenres,
  playLibraryMetrics,
  sortPlayCards,
  type PlayWizardCriteria
} from '../utils/library'

const props = defineProps<{
  plays: Play[]
}>()

const emit = defineEmits<{
  close: []
  apply: [criteria: PlayWizardCriteria]
}>()

const dialogRef = ref<HTMLElement | null>(null)
let opener: HTMLElement | null = null
let appRoot: HTMLElement | null = null
let appWasInert = false

const cards = computed(() => props.plays.map((play) => ({ play, metrics: playLibraryMetrics(play) })))
const maxPeople = computed(() => Math.max(1, ...cards.value.map((item) => item.metrics.characterCount)))
const maxDuration = computed(() => Math.max(1, ...cards.value.map((item) => item.metrics.estimatedMinutes)))
const genres = computed(() => [...new Set(props.plays.flatMap(playGenres))].sort((a, b) => a.localeCompare(b, 'fa')))

const step = ref(1)
const totalPeople = ref(maxPeople.value)
const malePeople = ref(Math.floor(maxPeople.value / 2))
const femalePeople = ref(maxPeople.value - malePeople.value)
const maxMinutes = ref(maxDuration.value)
const genre = ref('')

const criteria = computed<PlayWizardCriteria>(() => ({
  totalPeople: totalPeople.value,
  malePeople: malePeople.value,
  femalePeople: femalePeople.value,
  maxMinutes: maxMinutes.value,
  genre: genre.value || undefined
}))

const matches = computed(() => sortPlayCards(
  cards.value.filter(({ play, metrics }) => matchesWizardCriteria(play, metrics, criteria.value)),
  'duration-asc'
))

onMounted(async () => {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  appRoot = document.getElementById('app')
  appWasInert = appRoot?.hasAttribute('inert') ?? false
  if (appRoot && !appWasInert) appRoot.setAttribute('inert', '')

  await nextTick()
  focusableElements()[0]?.focus()
  if (!dialogRef.value?.contains(document.activeElement)) dialogRef.value?.focus()
})

onBeforeUnmount(() => {
  if (appRoot && !appWasInert) appRoot.removeAttribute('inert')
  opener?.focus()
})

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

function setTotal(value: number): void {
  totalPeople.value = Math.max(1, Math.min(finiteOr(value, totalPeople.value), maxPeople.value))
  if (malePeople.value > totalPeople.value) malePeople.value = totalPeople.value
  if (femalePeople.value > totalPeople.value - malePeople.value) {
    femalePeople.value = Math.max(0, totalPeople.value - malePeople.value)
  }
}

function setMale(value: number): void {
  malePeople.value = Math.max(0, Math.min(finiteOr(value, malePeople.value), totalPeople.value - femalePeople.value))
}

function setFemale(value: number): void {
  femalePeople.value = Math.max(0, Math.min(finiteOr(value, femalePeople.value), totalPeople.value - malePeople.value))
}

function focusableElements(): HTMLElement[] {
  if (!dialogRef.value) return []
  return Array.from(dialogRef.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ))
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  if (event.key !== 'Tab') return
  const focusable = focusableElements()
  if (focusable.length === 0) {
    event.preventDefault()
    dialogRef.value?.focus()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function applyCriteria(): void {
  emit('apply', criteria.value)
}
</script>

<template>
  <Teleport to="body">
    <div class="wizard-backdrop" @click.self="emit('close')">
      <section
        ref="dialogRef"
        class="play-wizard card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="play-wizard-title"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <header class="wizard-header">
          <div>
            <p class="eyebrow">انتخاب هوشمند نمایش</p>
            <h2 id="play-wizard-title">چه نمایشی برای گروه شما مناسب است؟</h2>
          </div>
          <button class="icon-button" type="button" aria-label="بستن ویزارد" @click="emit('close')">×</button>
        </header>

        <div class="wizard-steps" aria-label="مراحل ویزارد">
          <span :class="{ active: step >= 1 }">۱ · گروه</span>
          <span :class="{ active: step >= 2 }">۲ · زمان و ژانر</span>
          <span :class="{ active: step >= 3 }">۳ · پیشنهادها</span>
        </div>

        <div v-if="step === 1" class="wizard-panel">
          <h3>ترکیب گروه</h3>
          <p class="muted">راوی نقش مجازی است و در تعداد بازیگران حساب نمی‌شود؛ می‌تواند توسط یکی از اعضای گروه هم خوانده شود.</p>
          <div class="wizard-field-grid">
            <label>
              <span>کل افراد در دسترس</span>
              <input type="number" min="1" :max="maxPeople" :value="totalPeople" @input="setTotal(Number(($event.target as HTMLInputElement).value))" />
            </label>
            <label>
              <span>مرد</span>
              <input type="number" min="0" :max="totalPeople - femalePeople" :value="malePeople" @input="setMale(Number(($event.target as HTMLInputElement).value))" />
            </label>
            <label>
              <span>زن</span>
              <input type="number" min="0" :max="totalPeople - malePeople" :value="femalePeople" @input="setFemale(Number(($event.target as HTMLInputElement).value))" />
            </label>
          </div>
          <p class="wizard-hint">نقش‌های «نامشخص» انعطاف‌پذیرند و با هر فرد باقی‌مانده قابل پوشش‌اند.</p>
        </div>

        <div v-else-if="step === 2" class="wizard-panel">
          <h3>زمان و حال‌وهوای نمایش</h3>
          <label class="wizard-range">
            <span>حداکثر زمان: <strong>{{ maxMinutes }} دقیقه</strong></span>
            <input v-model.number="maxMinutes" type="range" min="1" :max="maxDuration" step="1" />
          </label>
          <label class="wizard-select">
            <span>ژانر مورد علاقه</span>
            <select v-model="genre">
              <option value="">هر ژانری</option>
              <option v-for="item in genres" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>
        </div>

        <div v-else class="wizard-panel">
          <div class="wizard-result-heading">
            <div>
              <h3>{{ matches.length }} پیشنهاد مناسب</h3>
              <p class="muted">نتایج از کوتاه‌ترین نمایش مرتب شده‌اند.</p>
            </div>
          </div>
          <div v-if="matches.length" class="wizard-results">
            <article v-for="item in matches.slice(0, 5)" :key="item.play.id" class="wizard-result">
              <div>
                <strong>{{ item.play.title }}</strong>
                <small>{{ item.play.author || 'نویسنده نامشخص' }}</small>
              </div>
              <span>{{ item.metrics.characterCount }} نقش</span>
              <span>{{ item.metrics.estimatedMinutes }} دقیقه</span>
            </article>
          </div>
          <p v-else class="wizard-empty">با این ترکیب گروه و زمان، نمایش مناسبی پیدا نشد. یک مرحله برگردید و محدودیت‌ها را بازتر کنید.</p>
        </div>

        <footer class="wizard-actions">
          <button v-if="step > 1" class="secondary-button" type="button" @click="step -= 1">مرحله قبل</button>
          <span class="wizard-spacer" />
          <button v-if="step < 3" class="primary-button" type="button" @click="step += 1">ادامه</button>
          <button v-else class="primary-button" type="button" @click="applyCriteria">اعمال روی کتابخانه</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
