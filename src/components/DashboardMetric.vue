<template>
  <QCard :class="$style.card" class="text-center">
    <QCardSection
      class="metric-title no-padding"
      data-cy="metric-title-section"
    >
      <slot>???</slot>
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
