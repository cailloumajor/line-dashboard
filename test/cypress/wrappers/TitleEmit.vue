<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <input v-model="input" data-cy="title-input" />
  <button @click="$emit('changeTitle', input)" data-cy="title-send">
    Send
  </button>
</template>

<script setup lang="ts">
import { ref } from "vue"

defineEmits<{
  (e: "changeTitle", value: string): void
}>()

const input = ref("")
</script>
