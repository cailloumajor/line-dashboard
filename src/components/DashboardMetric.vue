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
      <div v-if="dataValid" :class="rendered.color" data-cy="metric-value-text">
        {{ rendered.text }}
      </div>
      <QSkeleton v-else type="text" class="q-mx-auto" width="1em"></QSkeleton>
    </QCardSection>
  </QCard>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  value: number | string
  color?: string
  dataValid: boolean
}>()

const rendered = computed(() =>
  (props.value as number) < 0
    ? {
        text: "---",
        color: "text-grey-7",
      }
    : {
        text: props.value,
        color: props.color !== undefined ? `text-${props.color}` : undefined,
      },
)
</script>

<style module lang="scss">
.card {
  padding: 1%;
  line-height: 1;
}
</style>
