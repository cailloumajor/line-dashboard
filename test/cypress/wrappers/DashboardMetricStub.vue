<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <div>
    <div>
      Value: <span data-cy="value">{{ value }}</span>
    </div>
    <div>
      Color: <span data-cy="color">{{ color }}</span>
    </div>
    <div>
      Page height: <span data-cy="page-height">{{ pageHeight }}</span>
    </div>
    <div v-show="dataValid" data-cy="data-valid">Data is valid</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: number
  color?: string
  dataValid: boolean
  pageHeight?: number
}>()
</script>
