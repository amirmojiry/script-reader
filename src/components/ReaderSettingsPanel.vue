<script setup lang="ts">
import type { ReaderSettings } from '../types'
import { READER_FONT_OPTIONS } from '../utils/settings'

const props = withDefaults(defineProps<{
  settings: ReaderSettings
  wakeLockAvailable: boolean
  showClose?: boolean
}>(), {
  showClose: true
})

const emit = defineEmits<{
  updateSettings: [settings: ReaderSettings]
  close: []
}>()

function patch(value: Partial<ReaderSettings>): void {
  emit('updateSettings', { ...props.settings, ...value })
}
</script>

<template>
  <section class="settings-panel card" aria-label="تنظیمات خواندن">
    <div class="settings-heading">
      <div>
        <p class="eyebrow">تنظیمات خواندن</p>
        <h2>ظاهر متن و رفتار صفحه</h2>
        <p class="muted">تغییرات به‌صورت خودکار در همین مرورگر ذخیره می‌شوند.</p>
      </div>
      <button v-if="showClose" class="icon-button" type="button" aria-label="بستن تنظیمات" @click="emit('close')">×</button>
    </div>

    <div class="settings-grid">
      <label class="setting-field setting-field-wide">
        <span>فونت</span>
        <select
          :value="settings.font"
          @change="patch({ font: ($event.target as HTMLSelectElement).value as ReaderSettings['font'] })"
        >
          <option v-for="font in READER_FONT_OPTIONS" :key="font.value" :value="font.value">{{ font.label }}</option>
        </select>
      </label>

      <label class="setting-field">
        <span>اندازه متن <strong>{{ settings.fontSize }}px</strong></span>
        <input
          type="range"
          min="14"
          max="30"
          step="1"
          :value="settings.fontSize"
          @input="patch({ fontSize: Number(($event.target as HTMLInputElement).value) })"
        />
      </label>

      <label class="setting-field">
        <span>فاصله خطوط <strong>{{ settings.lineHeight.toFixed(1) }}</strong></span>
        <input
          type="range"
          min="1.4"
          max="2.6"
          step="0.1"
          :value="settings.lineHeight"
          @input="patch({ lineHeight: Number(($event.target as HTMLInputElement).value) })"
        />
      </label>

      <fieldset class="setting-field theme-picker">
        <legend>تم</legend>
        <div class="segmented compact">
          <button type="button" :class="{ active: settings.theme === 'light' }" @click="patch({ theme: 'light' })">روشن</button>
          <button type="button" :class="{ active: settings.theme === 'dark' }" @click="patch({ theme: 'dark' })">تیره</button>
        </div>
      </fieldset>

      <label class="setting-toggle">
        <input
          type="checkbox"
          :checked="settings.hideStageDirections"
          @change="patch({ hideStageDirections: ($event.target as HTMLInputElement).checked })"
        />
        <span>
          <strong>مخفی‌کردن توضیحات صحنه</strong>
          <small>برای تمرکز روی دیالوگ‌ها</small>
        </span>
      </label>

      <label v-if="wakeLockAvailable" class="setting-toggle">
        <input
          type="checkbox"
          :checked="settings.keepAwake"
          @change="patch({ keepAwake: ($event.target as HTMLInputElement).checked })"
        />
        <span>
          <strong>روشن نگه داشتن صفحه</strong>
          <small>در مرورگرهای پشتیبانی‌شده</small>
        </span>
      </label>
    </div>
  </section>
</template>
