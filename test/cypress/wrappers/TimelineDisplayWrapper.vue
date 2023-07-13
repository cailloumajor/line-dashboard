<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <div v-if="ready" data-cy="async-ready">READY</div>
  <Suspense @resolve="ready = true">
    <TimelineDisplay
      compute-api-url="/timeline-compute-api"
      :palette="['color1', 'color2', 'color3']"
      :opacity="0.9"
      :x-interval-minutes="61"
      :x-offset-minutes="45"
      :emphasis-labels="['some', 'other']"
      :legend="legend"
      :style="{ height }"
    />
  </Suspense>
</template>

<script setup lang="ts">
import { ref } from "vue"

import TimelineDisplay from "../../../src/components/TimelineDisplay.vue"

defineProps<{
  height: string
}>()

const ready = ref(false)

const legend = [
  { color: "red", text: "first item" },
  { color: "green", text: "second item" },
]
</script>
