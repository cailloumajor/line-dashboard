<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <div v-if="ready" data-cy="async-ready">READY</div>
  <Suspense @resolve="ready = true">
    <LineDashboard :id="id" />
  </Suspense>
</template>

<script setup lang="ts">
import { ref } from "vue"

import LineDashboard from "../../../src/pages/LineDashboard.vue"

defineProps<{
  id: string
}>()

const ready = ref(false)
</script>
