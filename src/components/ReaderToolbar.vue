<script setup lang="ts">
import { watch } from 'vue'
import type { ReaderMode, ReaderSettings } from '../types'
import { fontFamilyFor, normalizeReaderSettings } from '../utils/settings'

const props = defineProps<{
  mode: ReaderMode
  settings: ReaderSettings
  wakeLockAvailable: boolean
  speechAvailable: boolean
  searchQuery: string
  searchCount: number
}>()

const emit = defineEmits<{
  setMode: [mode: ReaderMode]
  updateSettings: [settings: ReaderSettings]
  speakOthers: []
  updateSearch: [query: string]
  searchNext: []
  searchPrevious: []
}>()

function patch(value: Partial<ReaderSettings>): void {
  emit('updateSettings', normalizeReaderSettings({ ...props.settings, ...value }))
}

watch(
  () => props.settings.font,
  (font) => {
    const normalized = normalizeReaderSettings({ ...props.settings, font })
    document.documentElement.style.setProperty('--app-reader-font-family', fontFamilyFor(normalized.font))
    if (normalized.font !== font) emit('updateSettings', normalized)
  },
  { immediate: true }
)
</script>

<template>
  <div class="reader-controls-stack">
    <div class="toolbar card">
      <div class="toolbar-primary">
        <div class="segmented" aria-label="حالت خواندن">
          <button :class="{ active: mode === 'read' }" @click="emit('setMode', 'read')">مطالعه</button>
          <button :class="{ active: mode === 'rehearsal' }" @click="emit('setMode', 'rehearsal')">تمرین</button>
          <button :class="{ active: mode === 'table-read' }" @click="emit('setMode', 'table-read')">نمایشنامه‌خوانی</button>
        </div>
        <RouterLink class="secondary-button settings-button" to="/settings">تنظیمات</RouterLink>
        <button v-if="speechAvailable" class="secondary-button" type="button" @click="emit('speakOthers')">خواندن نقش‌های دیگر</button>
      </div>

      <div class="search-control">
        <input
          type="search"
          placeholder="جست‌وجو در متن نمایشنامه"
          :value="searchQuery"
          @input="emit('updateSearch', ($event.target as HTMLInputElement).value)"
        />
        <span v-if="searchQuery" class="search-count">{{ searchCount }} نتیجه</span>
        <button class="small-button" :disabled="searchCount === 0" @click="emit('searchPrevious')">قبلی</button>
        <button class="small-button" :disabled="searchCount === 0" @click="emit('searchNext')">بعدی</button>
      </div>

      <div v-if="mode === 'rehearsal'" class="rehearsal-toolbar-options">
        <label>
          آشکارسازی
          <select
            :value="settings.rehearsalRevealMode"
            @change="patch({ rehearsalRevealMode: ($event.target as HTMLSelectElement).value as ReaderSettings['rehearsalRevealMode'] })"
          >
            <option value="hidden">کاملاً مخفی</option>
            <option value="first-words">سه کلمه اول</option>
            <option value="progressive">مرحله‌ای</option>
          </select>
        </label>
        <label class="inline-check">
          <input
            type="checkbox"
            :checked="settings.rehearsalCueOnly"
            @change="patch({ rehearsalCueOnly: ($event.target as HTMLInputElement).checked })"
          />
          فقط cue و دیالوگ من
        </label>
      </div>
    </div>
  </div>
</template>
