<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <div>
    first: <span data-cy="first">{{ fieldData.first }}</span>
  </div>
  <div>
    42: <span data-cy="second">{{ fieldData["42"] }}</span>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue"

import fieldDataComposable from "../../../src/composables/field-data"

const { fieldDataLinkBoot } = fieldDataComposable.useFieldDataLinkBoot()

const props = defineProps<{
  ns?: string
  nsURI?: string
}>()

const fieldData = reactive({
  first: 0,
  42: "initial",
})

fieldDataLinkBoot(fieldData, props.ns, props.nsURI)
</script>
