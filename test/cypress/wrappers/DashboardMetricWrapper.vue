<template>
  <DashboardMetric
    :value="value"
    :color="color"
    :data-valid="dataValid"
  ></DashboardMetric>
  <div>
    <input v-model="value" type="number" data-cy="number-input" />
    <input v-model="color" type="text" data-cy="color-input" />
    <input v-model="dataValid" type="checkbox" data-cy="data-valid-input" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"

import DashboardMetric from "../../../src/components/DashboardMetric.vue"

const value = ref(42)
const color = ref("")
const dataValid = ref(true)
</script>
