<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PlayFinderWizard from '../components/PlayFinderWizard.vue'
import { usePlaysStore } from '../stores/plays'
import {
  isWithinRange,
  matchesWizardCriteria,
  numericBounds,
  playGenres,
  playLibraryMetrics,
  sortPlayCards,
  type LibrarySortMode,
  type PlayWizardCriteria
} from '../utils/library'

const store = usePlaysStore()
const router = useRouter()
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const characterMin = ref<number | null>(null)
const characterMax = ref<number | null>(null)
const durationMin = ref<number | null>(null)
const durationMax = ref<number | null>(null)
const authorFilter = ref('')
const translatorFilter = ref('')
const genreFilter = ref('')
const sortMode = ref<LibrarySortMode>('title-asc')
const wizardOpen = ref(false)
const wizardCriteria = ref<PlayWizardCriteria | null>(null)
const wizardCharacterMaxOverride = ref<number | null>(null)
const wizardDurationMaxOverride = ref<number | null>(null)

const playCards = computed(() => store.plays.map((play) => ({ play, metrics: playLibraryMetrics(play) })))
const characterBounds = computed(() => numericBounds(playCards.value.map((item) => item.metrics.characterCount)))
const durationBounds = computed(() => numericBounds(playCards.value.map((item) => item.metrics.estimatedMinutes)))
const effectiveCharacterMin = computed(() => characterMin.value ?? characterBounds.value.min)
const effectiveCharacterMax = computed(() => characterMax.value ?? characterBounds.value.max)
const effectiveDurationMin = computed(() => durationMin.value ?? durationBounds.value.min)
const effectiveDurationMax = computed(() => durationMax.value ?? durationBounds.value.max)
const authors = computed(() => [...new Set(
  store.plays
    .map((play) => play.author)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
)].sort((a, b) => a.localeCompare(b, 'fa')))
const translators = computed(() => [...new Set(
  store.plays
    .map((play) => play.translator)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
)].sort((a, b) => a.localeCompare(b, 'fa')))
const genres = computed(() => [...new Set(store.plays.flatMap(playGenres))].sort((a, b) => a.localeCompare(b, 'fa')))
const filtersActive = computed(() =>
  characterMin.value !== null
  || characterMax.value !== null
  || durationMin.value !== null
  || durationMax.value !== null
  || Boolean(authorFilter.value)
  || Boolean(translatorFilter.value)
  || Boolean(genreFilter.value)
  || Boolean(wizardCriteria.value)
)
const filteredCards = computed(() => sortPlayCards(
  playCards.value.filter(({ play, metrics }) => {
    if (!isWithinRange(metrics.characterCount, effectiveCharacterMin.value, effectiveCharacterMax.value)) return false
    if (!isWithinRange(metrics.estimatedMinutes, effectiveDurationMin.value, effectiveDurationMax.value)) return false
    if (authorFilter.value && play.author !== authorFilter.value) return false
    if (translatorFilter.value === '__none__' && play.translator) return false
    if (translatorFilter.value && translatorFilter.value !== '__none__' && play.translator !== translatorFilter.value) return false
    if (genreFilter.value && !playGenres(play).includes(genreFilter.value)) return false
    if (wizardCriteria.value && !matchesWizardCriteria(play, metrics, {
      ...wizardCriteria.value,
      totalPeople: wizardCharacterMaxOverride.value ?? wizardCriteria.value.totalPeople,
      maxMinutes: wizardDurationMaxOverride.value ?? wizardCriteria.value.maxMinutes,
      genres: genreFilter.value ? [genreFilter.value] : wizardCriteria.value.genres
    })) return false
    return true
  }),
  sortMode.value
))

onMounted(() => store.initialize())

function setCharacterMin(value: number): void {
  characterMin.value = Math.min(value, effectiveCharacterMax.value)
}

function setCharacterMax(value: number): void {
  const next = Math.max(value, effectiveCharacterMin.value)
  characterMax.value = next
  if (wizardCriteria.value) wizardCharacterMaxOverride.value = next
}

function setDurationMin(value: number): void {
  durationMin.value = Math.min(value, effectiveDurationMax.value)
}

function setDurationMax(value: number): void {
  const next = Math.max(value, effectiveDurationMin.value)
  durationMax.value = next
  if (wizardCriteria.value) wizardDurationMaxOverride.value = next
}

function resetFilters(): void {
  characterMin.value = null
  characterMax.value = null
  durationMin.value = null
  durationMax.value = null
  authorFilter.value = ''
  translatorFilter.value = ''
  genreFilter.value = ''
  sortMode.value = 'title-asc'
  wizardCriteria.value = null
  wizardCharacterMaxOverride.value = null
  wizardDurationMaxOverride.value = null
}

function applyWizard(criteria: PlayWizardCriteria): void {
  wizardCriteria.value = criteria
  wizardCharacterMaxOverride.value = null
  wizardDurationMaxOverride.value = null
  characterMin.value = null
  characterMax.value = criteria.totalPeople >= characterBounds.value.min
    ? Math.min(criteria.totalPeople, characterBounds.value.max)
    : null
  durationMin.value = null
  durationMax.value = criteria.maxMinutes >= durationBounds.value.min
    ? Math.min(criteria.maxMinutes, durationBounds.value.max)
    : null
  genreFilter.value = ''
  authorFilter.value = ''
  translatorFilter.value = ''
  sortMode.value = 'duration-asc'
  wizardOpen.value = false
}

function toggleGenreFilter(genre: string): void {
  genreFilter.value = genreFilter.value === genre ? '' : genre
}

async function importFile(event: Event) {
  error.value = ''
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const play = await store.importJson(await file.text())
    await router.push({ name: 'reader', params: { id: play.id } })
  } catch (value) {
    error.value = value instanceof Error ? value.message : 'ورود فایل ناموفق بود.'
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <main class="page-shell library-page">
    <header class="hero">
      <div>
        <p class="eyebrow">Script Reader</p>
        <h1>نمایشنامه‌ها</h1>
        <p>مطالعه، تمرین نقش و نمایشنامه‌خوانی؛ آفلاین و بدون حساب کاربری.</p>
      </div>
      <div class="hero-actions">
        <button class="secondary-button" type="button" :disabled="!playCards.length" @click="wizardOpen = true">ویزارد انتخاب نمایش</button>
        <RouterLink class="secondary-button action-link" to="/settings">تنظیمات</RouterLink>
        <label class="primary-button file-button">
          افزودن JSON
          <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="importFile" />
        </label>
      </div>
    </header>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <section v-if="playCards.length" class="library-filters card" aria-label="فیلتر نمایشنامه‌ها">
      <div class="filter-heading">
        <div>
          <p class="eyebrow">فیلتر و مرتب‌سازی</p>
          <h2>پیدا کردن نمایش مناسب</h2>
          <p class="muted">مدت تقریبی شامل گفتار شخصیت‌ها و بخش‌های راوی است و بر اساس حدود ۱۳۰ کلمه در دقیقه محاسبه می‌شود.</p>
          <span v-if="wizardCriteria" class="wizard-active-badge">پیشنهاد ویزارد فعال است</span>
        </div>
        <div class="filter-result">
          <strong>{{ filteredCards.length }}</strong>
          <span>از {{ playCards.length }} نمایش</span>
          <button v-if="filtersActive" class="text-button" type="button" @click="resetFilters">حذف فیلترها</button>
        </div>
      </div>

      <div class="filter-grid">
        <fieldset class="range-filter">
          <legend>تعداد شخصیت</legend>
          <div class="range-values"><span>{{ effectiveCharacterMin }}</span><span>{{ effectiveCharacterMax }}</span></div>
          <label>
            حداقل
            <input
              type="range"
              :min="characterBounds.min"
              :max="characterBounds.max"
              step="1"
              :value="effectiveCharacterMin"
              @input="setCharacterMin(Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label>
            حداکثر
            <input
              type="range"
              :min="characterBounds.min"
              :max="characterBounds.max"
              step="1"
              :value="effectiveCharacterMax"
              @input="setCharacterMax(Number(($event.target as HTMLInputElement).value))"
            />
          </label>
        </fieldset>

        <fieldset class="range-filter">
          <legend>مدت تقریبی نمایش</legend>
          <div class="range-values"><span>{{ effectiveDurationMin }} دقیقه</span><span>{{ effectiveDurationMax }} دقیقه</span></div>
          <label>
            حداقل
            <input
              type="range"
              :min="durationBounds.min"
              :max="durationBounds.max"
              step="1"
              :value="effectiveDurationMin"
              @input="setDurationMin(Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label>
            حداکثر
            <input
              type="range"
              :min="durationBounds.min"
              :max="durationBounds.max"
              step="1"
              :value="effectiveDurationMax"
              @input="setDurationMax(Number(($event.target as HTMLInputElement).value))"
            />
          </label>
        </fieldset>
      </div>

      <div class="metadata-filter-grid">
        <label>
          <span>نویسنده</span>
          <select v-model="authorFilter">
            <option value="">همهٔ نویسندگان</option>
            <option v-for="author in authors" :key="author" :value="author">{{ author }}</option>
          </select>
        </label>
        <label>
          <span>مترجم</span>
          <select v-model="translatorFilter">
            <option value="">همهٔ مترجمان</option>
            <option v-for="translator in translators" :key="translator" :value="translator">{{ translator }}</option>
            <option value="__none__">بدون مترجم</option>
          </select>
        </label>
        <label>
          <span>ژانر</span>
          <select v-model="genreFilter">
            <option value="">همهٔ ژانرها</option>
            <option v-for="genre in genres" :key="genre" :value="genre">{{ genre }}</option>
          </select>
        </label>
        <label>
          <span>مرتب‌سازی</span>
          <select v-model="sortMode">
            <option value="title-asc">الفبایی</option>
            <option value="duration-asc">مدت: کوتاه به بلند</option>
            <option value="duration-desc">مدت: بلند به کوتاه</option>
            <option value="roles-asc">نقش: کم به زیاد</option>
            <option value="roles-desc">نقش: زیاد به کم</option>
          </select>
        </label>
      </div>
    </section>

    <section class="play-grid" aria-label="نمایشنامه‌های من">
      <article v-for="item in filteredCards" :key="item.play.id" class="play-card card">
        <div class="play-card-copy">
          <p class="eyebrow">{{ item.play.author || 'نویسنده نامشخص' }}</p>
          <h2>
            <RouterLink
              class="play-title-link"
              :to="{ name: 'reader', params: { id: item.play.id } }"
            >
              {{ item.play.title }}
            </RouterLink>
          </h2>
          <p v-if="item.play.translator" class="muted">مترجم: {{ item.play.translator }}</p>
          <div class="play-card-tags" aria-label="ژانرهای نمایش">
            <button
              v-for="genre in playGenres(item.play)"
              :key="genre"
              class="genre-chip"
              :class="{ active: genreFilter === genre }"
              type="button"
              :aria-pressed="genreFilter === genre"
              @click="toggleGenreFilter(genre)"
            >
              {{ genre }}
            </button>
          </div>
          <p class="cast-summary">
            {{ item.metrics.maleCount }} مرد · {{ item.metrics.femaleCount }} زن
            <template v-if="item.metrics.unknownCount"> · {{ item.metrics.unknownCount }} نامشخص</template>
          </p>
        </div>
        <div class="play-card-control-grid" aria-label="مشخصات نمایشنامه">
          <span class="play-card-control play-card-metric">{{ item.metrics.characterCount }} نقش</span>
          <span class="play-card-control play-card-metric">{{ item.metrics.dialogueCount }} دیالوگ</span>
          <span class="play-card-control play-card-metric">حدود {{ item.metrics.estimatedMinutes }} دقیقه</span>
        </div>
      </article>
    </section>

    <section v-if="playCards.length && filteredCards.length === 0" class="card empty-filter-state">
      <h2>نمایشی با این شرایط پیدا نشد</h2>
      <p class="muted">محدودیت تعداد شخصیت، زمان، ترکیب گروه یا ژانر را بازتر کنید.</p>
      <button class="secondary-button" type="button" @click="resetFilters">نمایش همه</button>
    </section>

    <PlayFinderWizard v-if="wizardOpen" :plays="store.plays" @close="wizardOpen = false" @apply="applyWizard" />
  </main>
</template>
