<script setup lang="ts">
import { ref, watch } from 'vue'

interface ProofreadingDraft {
  label: string
  originalText: string
}

const props = defineProps<{
  draft: ProofreadingDraft
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [correctedText: string]
  cancel: []
}>()

const correctedText = ref(props.draft.originalText)

watch(() => props.draft, (draft) => {
  correctedText.value = draft.originalText
}, { deep: true })

function submit(): void {
  if (props.saving || correctedText.value === props.draft.originalText) return
  emit('save', correctedText.value)
}
</script>

<template>
  <aside class="proofreading-editor-dock card" aria-label="ویرایش عیب متن">
    <div class="proofreading-editor-heading">
      <div>
        <p class="eyebrow">عیب‌یابی متن</p>
        <strong>{{ draft.label }}</strong>
      </div>
      <button class="text-button" type="button" :disabled="saving" @click="emit('cancel')">بستن</button>
    </div>
    <div class="proofreading-editor-grid">
      <label>
        <span>متن اشتباه</span>
        <textarea :value="draft.originalText" rows="3" readonly />
      </label>
      <label>
        <span>متن درست</span>
        <textarea v-model="correctedText" rows="3" :disabled="saving" autofocus />
      </label>
    </div>
    <div class="proofreading-editor-actions">
      <button class="primary-button" type="button" :disabled="saving || correctedText === draft.originalText" @click="submit">
        {{ saving ? 'در حال ثبت…' : 'ثبت و کپی' }}
      </button>
      <span class="muted">متن نمایشنامه تغییر نمی‌کند؛ اصلاح فقط در گزارش محلی ذخیره می‌شود.</span>
    </div>
  </aside>
</template>
