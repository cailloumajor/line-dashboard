<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <div>
    <div class="prevent-overflow">
      Compute API URL:
      <span data-cy="timeline-compute-url">{{ computeApiUrl }}</span>
    </div>
    <div class="prevent-overflow">
      Color palette:
      <span data-cy="timeline-color-palette">{{ palette }}</span>
    </div>
    <div class="prevent-overflow">
      Opacity: <span data-cy="timeline-opacity">{{ opacity }}</span>
    </div>
    <div class="prevent-overflow">
      X-axis Interval:
      <span data-cy="timeline-x-interval">{{ xIntervalMinutes }}</span>
    </div>
    <div class="prevent-overflow">
      X-axis offset:
      <span data-cy="timeline-x-offset">{{ xOffsetMinutes }}</span>
    </div>
    <div class="prevent-overflow">
      Emphasized labels:
      <span data-cy="timeline-labels-emphasis">{{ emphasisLabels }}</span>
    </div>
    <div class="prevent-overflow">
      Legend: <span data-cy="timeline-legend">{{ legend }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  computeApiUrl: string
  palette: string[]
  fluxQuery: string
  opacity: number
  xIntervalMinutes: number
  xOffsetMinutes: number
  emphasisLabels: string[]
  legend: []
}>()
</script>

<style lang="scss" scoped>
.prevent-overflow {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
