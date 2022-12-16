<template>
  <QCard :class="$style.card" class="text-center">
    <QCardSection class="no-padding">
      <div class="metric-title text-uppercase" data-cy="metric-title-content">
        <slot>???</slot>
      </div>
    </QCardSection>
    <QCardSection
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
      <QSkeleton v-else type="text" class="q-mx-auto" width="1em"></QSkeleton>
    </QCardSection>
  </QCard>
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
