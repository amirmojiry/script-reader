<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaysStore } from '../stores/plays'
import { isWithinRange, numericBounds, playLibraryMetrics } from '../utils/library'

const store = usePlaysStore()
const router = useRouter()
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const characterMin = ref<number | null>(null)
const characterMax = ref<number | null>(null)
const durationMin = ref<number | null>(null)
const durationMax = ref<number | null>(null)

const playCards = computed(() => store.plays.map((play) => ({ play, metrics: playLibraryMetrics(play) })))
const characterBounds = computed(() => numericBounds(playCards.value.map((item) => item.metrics.characterCount)))
const durationBounds = computed(() => numericBounds(playCards.value.map((item) => item.metrics.estimatedMinutes)))
const effectiveCharacterMin = computed(() => characterMin.value ?? characterBounds.value.min)
const effectiveCharacterMax = computed(() => characterMax.value ?? characterBounds.value.max)
const effectiveDurationMin = computed(() => durationMin.value ?? durationBounds.value.min)
const effectiveDurationMax = computed(() => durationMax.value ?? durationBounds.value.max)
const filtersActive = computed(() => characterMin.value !== null || characterMax.value !== null || durationMin.value !== null || durationMax.value !== null)
const filteredCards = computed(() => playCards.value.filter(({ metrics }) =>
  isWithinRange(metrics.characterCount, effectiveCharacterMin.value, effectiveCharacterMax.value)
  && isWithinRange(metrics.estimatedMinutes, effectiveDurationMin.value, effectiveDurationMax.value)
))

onMounted(() => store.initialize())

function setCharacterMin(value: number): void {
  characterMin.value = Math.min(value, effectiveCharacterMax.value)
}

function setCharacterMax(value: number): void {
  characterMax.value = Math.max(value, effectiveCharacterMin.value)
}

function setDurationMin(value: number): void {
  durationMin.value = Math.min(value, effectiveDurationMax.value)
}

function setDurationMax(value: number): void {
  durationMax.value = Math.max(value, effectiveDurationMin.value)
}

function resetFilters(): void {
  characterMin.value = null
  characterMax.value = null
  durationMin.value = null
  durationMax.value = null
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
          <p class="eyebrow">فیلتر</p>
          <h2>پیدا کردن نمایش مناسب</h2>
          <p class="muted">مدت تقریبی بر اساس حدود ۱۳۰ کلمهٔ گفتاری در دقیقه محاسبه می‌شود.</p>
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
    </section>

    <section class="play-grid" aria-label="نمایشنامه‌های من">
      <article v-for="item in filteredCards" :key="item.play.id" class="play-card card">
        <div>
          <p class="eyebrow">{{ item.play.author || 'نویسنده نامشخص' }}</p>
          <h2>{{ item.play.title }}</h2>
          <p v-if="item.play.translator" class="muted">مترجم: {{ item.play.translator }}</p>
        </div>
        <div class="play-metrics">
          <span>{{ item.metrics.characterCount }} نقش</span>
          <span>{{ item.metrics.dialogueCount }} دیالوگ</span>
          <span>حدود {{ item.metrics.estimatedMinutes }} دقیقه</span>
        </div>
        <button class="primary-button" @click="router.push({ name: 'reader', params: { id: item.play.id } })">باز کردن</button>
      </article>
    </section>

    <section v-if="playCards.length && filteredCards.length === 0" class="card empty-filter-state">
      <h2>نمایشی در این بازه پیدا نشد</h2>
      <p class="muted">بازهٔ تعداد شخصیت یا مدت زمان را بازتر کنید.</p>
      <button class="secondary-button" type="button" @click="resetFilters">نمایش همه</button>
    </section>

    <section class="card import-help">
      <h2>فرمت ورود</h2>
      <p>نمایشنامه‌ها در قالب JSON ساختاریافته ذخیره می‌شوند؛ متن گفتار و توضیح اجرایی داخل دیالوگ از هم جدا هستند تا تمرین و آمار دقیق بماند.</p>
    </section>
  </main>
</template>
