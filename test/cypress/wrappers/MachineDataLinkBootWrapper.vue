<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <div>
    first: <span data-cy="first">{{ machineData.val.first }}</span>
  </div>
  <div>
    second: <span data-cy="second">{{ machineData.val.second }}</span>
  </div>
  <div>
    second: <span data-cy="ts-one">{{ machineData.ts.one }}</span>
  </div>
  <div>
    second: <span data-cy="ts-two">{{ machineData.ts.two }}</span>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue"

import machineDataComposable from "../../../src/composables/machine-data"

const { machineDataLinkBoot } = machineDataComposable.useMachineDataLinkBoot()

const props = defineProps<{
  partnerID?: string
}>()

const machineData = reactive({
  val: {
    first: 0,
    second: "initial",
  },
  ts: {
    one: "some_ts",
    two: "other_ts",
  },
})

machineDataLinkBoot(machineData, props.partnerID ?? "")
</script>
