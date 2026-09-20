<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ReaderSettingsPanel from '../components/ReaderSettingsPanel.vue'
import { getSettings, saveSettings } from '../services/storage'
import { wakeLockSupported } from '../services/wakeLock'
import type { ReaderSettings } from '../types'
import { DEFAULT_READER_SETTINGS, fontFamilyFor, normalizeReaderSettings } from '../utils/settings'

const route = useRoute()
const settings = ref<ReaderSettings>({ ...DEFAULT_READER_SETTINGS })
const loaded = ref(false)
const status = ref('')
const settingsBackTarget = computed(() => {
  const playId = typeof route.query.play === 'string' ? route.query.play.trim() : ''
  if (route.query.from === 'reader' && playId) {
    return { name: 'reader', params: { id: playId } }
  }
  return { name: 'library' }
})

function applyFont(next: ReaderSettings): void {
  document.documentElement.style.setProperty('--app-reader-font-family', fontFamilyFor(next.font))
}

onMounted(async () => {
  settings.value = await getSettings()
  applyFont(settings.value)
  loaded.value = true
})

async function updateSettings(next: ReaderSettings): Promise<void> {
  const normalized = normalizeReaderSettings(next)
  settings.value = normalized
  applyFont(normalized)
  await saveSettings(normalized)
  status.value = 'تنظیمات ذخیره شد.'
}
</script>

<template>
  <main
    class="page-shell settings-page"
    :class="{ 'dark-theme': settings.theme === 'dark' }"
    :style="{ '--app-reader-font-family': fontFamilyFor(settings.font) }"
  >
    <header class="settings-page-header card">
      <RouterLink class="text-button settings-back-link" :to="settingsBackTarget">← برگشت</RouterLink>
      <div>
        <p class="eyebrow">تنظیمات</p>
        <h1>ظاهر و رفتار خوانش</h1>
        <p class="muted">این تنظیمات برای همهٔ نمایشنامه‌هاست و در همین مرورگر باقی می‌ماند؛ بعد از رفرش یا بازکردن دوباره نیز بازیابی می‌شود.</p>
      </div>
      <span v-if="status" class="status-message" role="status">{{ status }}</span>
    </header>

    <ReaderSettingsPanel
      v-if="loaded"
      :settings="settings"
      :wake-lock-available="wakeLockSupported()"
      :show-close="false"
      @update-settings="updateSettings"
    />

    <section class="settings-preview card" aria-label="پیش‌نمایش متن">
      <p class="eyebrow">پیش‌نمایش</p>
      <p class="settings-preview-copy" :style="{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }">
        این یک نمونهٔ کوتاه برای دیدن فونت، اندازهٔ متن و فاصلهٔ خطوط است.
      </p>
    </section>
  </main>
</template>
