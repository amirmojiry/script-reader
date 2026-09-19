<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Play } from '../types'
import { matchesWizardCriteria, playGenres, playLibraryMetrics, sortPlayCards, type PlayWizardCriteria } from '../utils/library'

const props = defineProps<{ plays: Play[] }>()
const emit = defineEmits<{ close: []; apply: [criteria: PlayWizardCriteria] }>()

const dialogRef = ref<HTMLElement | null>(null)
const detailsHeadingRef = ref<HTMLElement | null>(null)
const detailsRevealed = ref(false)
let opener: HTMLElement | null = null
let appRoot: HTMLElement | null = null
let appWasInert = false

const cards = computed(() => props.plays.map((play) => ({ play, metrics: playLibraryMetrics(play) })))
const maxPeople = computed(() => Math.max(1, ...cards.value.map((item) => item.metrics.characterCount)))
const maxDuration = computed(() => Math.max(1, ...cards.value.map((item) => item.metrics.estimatedMinutes)))
const genres = computed(() => [...new Set(props.plays.flatMap(playGenres))].sort((a, b) => a.localeCompare(b, 'fa')))

const totalPeople = ref(maxPeople.value)
const malePeople = ref(Math.floor(maxPeople.value / 2))
const femalePeople = ref(maxPeople.value - malePeople.value)
const maxMinutes = ref(maxDuration.value)
const selectedGenres = ref<string[]>([])

const maleMax = computed(() => Math.max(0, totalPeople.value - femalePeople.value))
const femaleMax = computed(() => Math.max(0, totalPeople.value - malePeople.value))
const criteria = computed<PlayWizardCriteria>(() => ({
  totalPeople: totalPeople.value,
  malePeople: malePeople.value,
  femalePeople: femalePeople.value,
  maxMinutes: maxMinutes.value,
  genres: selectedGenres.value.length ? [...selectedGenres.value] : undefined
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
  malePeople.value = Math.min(malePeople.value, totalPeople.value)
  femalePeople.value = Math.min(femalePeople.value, totalPeople.value - malePeople.value)
}
function setMale(value: number): void {
  malePeople.value = Math.max(0, Math.min(finiteOr(value, malePeople.value), maleMax.value))
}
function setFemale(value: number): void {
  femalePeople.value = Math.max(0, Math.min(finiteOr(value, femalePeople.value), femaleMax.value))
}
function toggleGenre(genre: string): void {
  selectedGenres.value = selectedGenres.value.includes(genre)
    ? selectedGenres.value.filter((item) => item !== genre)
    : [...selectedGenres.value, genre]
}
async function revealDetails(): Promise<void> {
  detailsRevealed.value = true
  await nextTick()
  detailsHeadingRef.value?.focus()
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
      <section ref="dialogRef" class="play-wizard card" role="dialog" aria-modal="true" aria-labelledby="play-wizard-title" tabindex="-1" @keydown="handleKeydown">
        <header class="wizard-header">
          <div>
            <p class="eyebrow">انتخاب هوشمند نمایش</p>
            <h2 id="play-wizard-title">چه نمایشی برای گروه شما مناسب است؟</h2>
          </div>
          <button class="icon-button" type="button" aria-label="بستن ویزارد" @click="emit('close')">×</button>
        </header>

        <div class="wizard-progress">
          <section class="wizard-panel">
            <h3>ترکیب گروه</h3>
            <p class="muted">راوی نقش مجازی است و در تعداد بازیگران حساب نمی‌شود؛ می‌تواند توسط یکی از اعضای گروه هم خوانده شود.</p>
            <div class="wizard-slider-grid">
              <label class="wizard-range">
                <span>کل افراد: <strong>{{ totalPeople }}</strong></span>
                <small>از ۱ تا {{ maxPeople }}</small>
                <input type="range" min="1" :max="maxPeople" step="1" :value="totalPeople" aria-label="تعداد کل افراد" @input="setTotal(Number(($event.target as HTMLInputElement).value))" />
              </label>
              <label class="wizard-range">
                <span>مرد: <strong>{{ malePeople }}</strong></span>
                <small>از ۰ تا {{ maleMax }}</small>
                <input type="range" min="0" :max="maleMax" step="1" :value="malePeople" aria-label="تعداد مردان" @input="setMale(Number(($event.target as HTMLInputElement).value))" />
              </label>
              <label class="wizard-range">
                <span>زن: <strong>{{ femalePeople }}</strong></span>
                <small>از ۰ تا {{ femaleMax }}</small>
                <input type="range" min="0" :max="femaleMax" step="1" :value="femalePeople" aria-label="تعداد زنان" @input="setFemale(Number(($event.target as HTMLInputElement).value))" />
              </label>
            </div>
            <p class="wizard-hint">نقش‌های «نامشخص» انعطاف‌پذیرند و با هر فرد باقی‌مانده قابل پوشش‌اند.</p>
            <button v-if="!detailsRevealed" class="primary-button wizard-continue" type="button" @click="revealDetails">ادامه</button>
          </section>

          <template v-if="detailsRevealed">
            <section class="wizard-panel">
              <h3 ref="detailsHeadingRef" tabindex="-1">زمان و ژانر</h3>
              <label class="wizard-range">
                <span>حداکثر زمان: <strong>{{ maxMinutes }} دقیقه</strong></span>
                <input v-model.number="maxMinutes" type="range" min="1" :max="maxDuration" step="1" />
              </label>
              <fieldset class="wizard-genres">
                <legend>ژانرها</legend>
                <p class="muted">می‌توانید چند ژانر را هم‌زمان روشن کنید. انتخاب‌ها به‌صورت «یا» اعمال می‌شوند.</p>
                <div class="wizard-genre-list">
                  <button v-for="genre in genres" :key="genre" type="button" class="genre-chip" :class="{ active: selectedGenres.includes(genre) }" :aria-pressed="selectedGenres.includes(genre)" @click="toggleGenre(genre)">{{ genre }}</button>
                </div>
              </fieldset>
            </section>

            <section class="wizard-panel wizard-results-panel" aria-live="polite">
              <div class="wizard-result-heading">
                <div>
                  <h3>{{ matches.length }} پیشنهاد مناسب</h3>
                  <p class="muted">نتایج هم‌زمان با تغییر تعداد افراد، زمان یا ژانر به‌روزرسانی می‌شوند.</p>
                </div>
              </div>
              <div v-if="matches.length" class="wizard-results">
                <article v-for="item in matches.slice(0, 5)" :key="item.play.id" class="wizard-result">
                  <div><strong>{{ item.play.title }}</strong><small>{{ item.play.author || 'نویسنده نامشخص' }}</small></div>
                  <span>{{ item.metrics.characterCount }} نقش</span>
                  <span>{{ item.metrics.estimatedMinutes }} دقیقه</span>
                </article>
              </div>
              <p v-else class="wizard-empty">با این ترکیب گروه و زمان، نمایش مناسبی پیدا نشد. محدودیت‌ها را بازتر کنید.</p>
            </section>

            <footer class="wizard-actions">
              <span class="wizard-spacer" />
              <button class="primary-button" type="button" @click="applyCriteria">اعمال روی کتابخانه</button>
            </footer>
          </template>
        </div>
      </section>
    </div>
  </Teleport>
</template>
