<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaysStore } from '../stores/plays'
import { analyzePlay } from '../utils/play'

const store = usePlaysStore()
const router = useRouter()
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => store.initialize())

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
      <label class="primary-button file-button">
        افزودن JSON
        <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="importFile" />
      </label>
    </header>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <section class="play-grid" aria-label="نمایشنامه‌های من">
      <article v-for="play in store.plays" :key="play.id" class="play-card card">
        <div>
          <p class="eyebrow">{{ play.author || 'نویسنده نامشخص' }}</p>
          <h2>{{ play.title }}</h2>
          <p v-if="play.translator" class="muted">مترجم: {{ play.translator }}</p>
        </div>
        <div class="play-metrics">
          <span>{{ play.characters.length }} نقش</span>
          <span>{{ Object.values(analyzePlay(play)).reduce((sum, item) => sum + item.dialogueCount, 0) }} دیالوگ</span>
        </div>
        <button class="primary-button" @click="router.push({ name: 'reader', params: { id: play.id } })">باز کردن</button>
      </article>
    </section>

    <section class="card import-help">
      <h2>فرمت ورود</h2>
      <p>نمایشنامه‌ها در قالب JSON ساختاریافته ذخیره می‌شوند؛ متن گفتار و توضیح اجرایی داخل دیالوگ از هم جدا هستند تا تمرین و آمار دقیق بماند.</p>
    </section>
  </main>
</template>
