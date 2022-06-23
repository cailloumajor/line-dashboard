<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <div>
    first: <span data-cy="first">{{ machineData.first }}</span>
  </div>
  <div>
    second: <span data-cy="second">{{ machineData.second }}</span>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue"

import machineDataComposable from "../../../src/composables/machine-data"

const { machineDataLinkBoot } = machineDataComposable.useMachineDataLinkBoot()

const props = defineProps<{
  ns?: string
  nsURI?: string
}>()

const machineData = reactive({
  first: 0,
  second: "initial",
})

machineDataLinkBoot(
  machineData,
  { second: 42 },
  props.ns ?? "",
  props.nsURI ?? ""
)
</script>
