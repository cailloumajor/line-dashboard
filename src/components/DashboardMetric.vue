<template>
  <q-card :class="$style.card" class="text-center" ref="card">
    <q-card-section
      :style="titleStyle"
      class="q-pa-none"
      data-cy="metric-title-section"
    >
      <div
        v-if="dataValid"
        class="text-weight-bold"
        data-cy="metric-title-content"
      >
        <slot>???</slot>
      </div>
      <q-skeleton
        v-else
        :class="$style.titleSkeleton"
        type="text"
        class="q-mx-auto"
      ></q-skeleton>
    </q-card-section>
    <q-card-section
      :style="valueStyle"
      class="q-pa-none"
      data-cy="metric-value-section"
    >
      <div
        v-if="dataValid"
        :class="color !== undefined ? `text-${color}` : undefined"
        data-cy="metric-value-text"
      >
        {{ value }}
      </div>
      <q-skeleton
        v-else
        :class="$style.valueSkeleton"
        type="text"
        class="q-mx-auto"
      ></q-skeleton>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { watchDebounced } from "@vueuse/core"
import { reactive, ref } from "vue"

import type { QCard } from "quasar"
import type { CSSProperties } from "vue"

const props = defineProps<{
  value: number
  color?: string
  dataValid: boolean
  pageHeight?: number
}>()

const card = ref<InstanceType<typeof QCard> | null>(null)

const titleStyle = reactive<CSSProperties>({})
const valueStyle = reactive<CSSProperties>({})

watchDebounced(
  () => props.pageHeight,
  async (newHeight) => {
    if (newHeight === undefined || card.value === null) return
    titleStyle.fontSize = "1px"
    valueStyle.fontSize = "1px"
    await new Promise((resolve) => {
      setTimeout(resolve, 200)
    })
    const cardElem = card.value.$el as HTMLDivElement
    const { height } = cardElem.getBoundingClientRect()
    const { paddingTop, paddingBottom } = window.getComputedStyle(cardElem)
    const cardHeight =
      height - parseFloat(paddingTop) - parseFloat(paddingBottom)
    titleStyle.fontSize = `${cardHeight * 0.19}px`
    valueStyle.fontSize = `${cardHeight * 0.79}px`
  },
  { debounce: 500, immediate: true }
)
</script>

<style module lang="scss">
.card {
  padding: 1%;
  line-height: 1;
}

.titleSkeleton {
  width: 50%;
}

.valueSkeleton {
  width: 1em;
}
</style>
