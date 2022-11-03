<template>
  <q-card :class="$style.card" class="text-center">
    <q-card-section class="no-padding">
      <div class="metric-title text-uppercase" data-cy="metric-title-content">
        <slot>???</slot>
      </div>
    </q-card-section>
    <q-card-section
      class="metric-value no-padding"
      data-cy="metric-value-section"
    >
      <div
        v-if="dataValid"
        v-show="!disableValue"
        :class="color !== undefined ? `text-${color}` : undefined"
        data-cy="metric-value-text"
      >
        {{ value }}
      </div>
      <q-skeleton v-else type="text" class="q-mx-auto" width="1em"></q-skeleton>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  value: number | string
  color?: string
  dataValid: boolean
  disableValue?: boolean
}>()
</script>

<style module lang="scss">
.card {
  padding: 1%;
  line-height: 1;
}
</style>
