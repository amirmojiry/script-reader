<script setup lang="ts">
import type { ReaderMode, ReaderSettings } from '../types'

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

function patch(patchValue: Partial<ReaderSettings>) {
  emit('updateSettings', { ...props.settings, ...patchValue })
}
</script>

<template>
  <div class="toolbar card">
    <div class="segmented" aria-label="حالت خواندن">
      <button :class="{ active: mode === 'read' }" @click="emit('setMode', 'read')">مطالعه</button>
      <button :class="{ active: mode === 'rehearsal' }" @click="emit('setMode', 'rehearsal')">تمرین</button>
      <button :class="{ active: mode === 'table-read' }" @click="emit('setMode', 'table-read')">نمایشنامه‌خوانی</button>
    </div>

    <label>اندازه متن <input type="range" min="14" max="28" :value="settings.fontSize" @input="patch({ fontSize: Number(($event.target as HTMLInputElement).value) })" /></label>
    <label>فاصله خطوط <input type="range" min="1.4" max="2.4" step="0.1" :value="settings.lineHeight" @input="patch({ lineHeight: Number(($event.target as HTMLInputElement).value) })" /></label>
    <label>
      فونت
      <select :value="settings.font" @change="patch({ font: ($event.target as HTMLSelectElement).value as ReaderSettings['font'] })">
        <option value="system">سیستم</option>
        <option value="sans">Sans</option>
        <option value="serif">Serif</option>
      </select>
    </label>
    <label>
      تم
      <select :value="settings.theme" @change="patch({ theme: ($event.target as HTMLSelectElement).value as ReaderSettings['theme'] })">
        <option value="light">روشن</option>
        <option value="dark">تیره</option>
      </select>
    </label>

    <label><input type="checkbox" :checked="settings.hideStageDirections" @change="patch({ hideStageDirections: ($event.target as HTMLInputElement).checked })" /> مخفی‌کردن توضیحات صحنه</label>
    <label v-if="wakeLockAvailable"><input type="checkbox" :checked="settings.keepAwake" @change="patch({ keepAwake: ($event.target as HTMLInputElement).checked })" /> روشن نگه داشتن صفحه</label>

    <template v-if="mode === 'rehearsal'">
      <label>
        آشکارسازی
        <select :value="settings.rehearsalRevealMode" @change="patch({ rehearsalRevealMode: ($event.target as HTMLSelectElement).value as ReaderSettings['rehearsalRevealMode'] })">
          <option value="hidden">کاملاً مخفی</option>
          <option value="first-words">سه کلمه اول</option>
          <option value="progressive">مرحله‌ای</option>
        </select>
      </label>
      <label><input type="checkbox" :checked="settings.rehearsalCueOnly" @change="patch({ rehearsalCueOnly: ($event.target as HTMLInputElement).checked })" /> فقط cue و دیالوگ من</label>
    </template>

    <button v-if="speechAvailable" class="secondary-button" @click="emit('speakOthers')">خواندن نقش‌های دیگر</button>

    <div class="search-control">
      <input
        type="search"
        placeholder="جست‌وجو در متن"
        :value="searchQuery"
        @input="emit('updateSearch', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="searchQuery" class="muted">{{ searchCount }} نتیجه</span>
      <button class="small-button" :disabled="searchCount === 0" @click="emit('searchPrevious')">قبلی</button>
      <button class="small-button" :disabled="searchCount === 0" @click="emit('searchNext')">بعدی</button>
    </div>
  </div>
</template>
