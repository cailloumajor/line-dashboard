<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <div>
    <div class="prevent-overflow">
      InfluxDB org: <span data-cy="influxdb-org">{{ influxdbOrg }}</span>
    </div>
    <div class="prevent-overflow">
      InfluxDB token: <span data-cy="influxdb-token">{{ influxdbToken }}</span>
    </div>
    <div class="prevent-overflow">
      Flux Query: <span data-cy="flux-query">{{ fluxQuery }}</span>
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
      Legend: <span data-cy="timeline-legend">{{ legend }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  influxdbOrg: string
  influxdbToken: string
  fluxQuery: string
  opacity: number
  xIntervalMinutes: number
  xOffsetMinutes: number
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
