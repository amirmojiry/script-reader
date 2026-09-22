<script setup lang="ts">
import { ref, watch } from 'vue'

interface ProofreadingDraft {
  label: string
  text: string
}

const props = defineProps<{
  draft: ProofreadingDraft
  saving?: boolean
  canRevert?: boolean
}>()

const emit = defineEmits<{
  save: [text: string, direction: -1 | 1]
  preview: [text: string]
  cancel: []
  revert: []
}>()

const text = ref(props.draft.text)

watch(() => props.draft, (draft) => {
  text.value = draft.text
}, { deep: true })

function submit(direction: -1 | 1): void {
  if (props.saving) return
  emit('save', text.value, direction)
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

    <label class="proofreading-editor-text">
      <span>متن</span>
      <textarea v-model="text" rows="4" :disabled="saving" autofocus @input="emit('preview', text)" />
    </label>

    <div class="proofreading-editor-actions">
      <button
        class="secondary-button proofreading-revert-button"
        type="button"
        :disabled="saving || !canRevert"
        @click="emit('revert')"
      >
        برگردان
      </button>
      <div class="proofreading-navigation-actions">
        <button
          class="secondary-button"
          type="button"
          :disabled="saving"
          @click="submit(-1)"
        >
          ثبت و قبلی
        </button>
        <button
          class="primary-button"
          type="button"
          :disabled="saving"
          @click="submit(1)"
        >
          {{ saving ? 'در حال ثبت…' : 'ثبت و بعدی' }}
        </button>
      </div>
    </div>
  </aside>
</template>
