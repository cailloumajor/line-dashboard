<template>
  <QCard
    ref="cardElem"
    :class="$style.rootContainer"
    data-cy="timeline-container"
  >
    <template v-if="error === null">
      <canvas
        ref="canvasElem"
        data-cy="timeline-canvas"
        :height="canvasSize.height"
        :width="canvasSize.width"
      >
      </canvas>
      <div class="q-my-auto" data-cy="legend" :style="legendStyle">
        <template v-for="(item, index) in legend" :key="`legend-${index}`">
          <div
            :class="`bg-${item.color}`"
            :style="legendBoxStyle"
            data-cy="legend-box"
          ></div>
          <div>{{ item.text }}</div>
        </template>
      </div>
    </template>
    <div
      v-else
      :style="errorStyle"
      class="q-my-auto text-center text-negative"
      data-cy="timeline-error"
    >
      {{ error }}
    </div>
  </QCard>
</template>

<script setup lang="ts">
import { useDebounceFn, useIntervalFn, useResizeObserver } from "@vueuse/core"
import { QCard } from "quasar"
import { computed, nextTick, onMounted, reactive, ref } from "vue"

import { influxdbPath, timelineRefreshMillis } from "src/global"

import influxdbUtils from "./influxdb-utils-wasm"

import type { ResizeObserverSize } from "@vueuse/core"

interface LegendItem {
  color: string
  text: string
}

const { init, wasmUrl, Timeline } = influxdbUtils

const props = defineProps<{
  influxdbOrg: string
  influxdbToken: string
  fluxQuery: string
  opacity: number
  legend: LegendItem[]
}>()

const cardElem = ref<InstanceType<typeof QCard> | null>(null)
const canvasElem = ref<HTMLCanvasElement | null>(null)

const canvasSize = reactive({
  height: 150,
  width: 300,
})

const cardHeight = ref(0)

const error = ref<string | null>(null)

const legendStyle = computed(() => ({
  display: "flex",
  alignItems: "center",
  fontSize: `${cardHeight.value * 0.1}px`,
}))

const legendBoxStyle = computed(() => ({
  marginLeft: `${cardHeight.value * 0.15}px`,
  marginRight: `${cardHeight.value * 0.03}px`,
  opacity: props.opacity,
  height: legendStyle.value.fontSize,
  width: legendStyle.value.fontSize,
}))

const errorStyle = computed(() => ({
  fontSize: `${cardHeight.value * 0.12}px`,
}))

onMounted(() => {
  if (canvasElem.value === null) {
    throw new Error("canvas element ref is null")
  }
  const fontFamily = window.getComputedStyle(canvasElem.value).fontFamily
  const influxdbUrl = new URL(influxdbPath, window.location.origin).toString()
  const { influxdbOrg, influxdbToken, fluxQuery, opacity } = props
  const timeline = new Timeline(canvasElem.value, {
    fontFamily,
    opacity,
    influxdbUrl,
    influxdbOrg,
    influxdbToken,
    fluxQuery,
  })

  const drawTimeline = async () => {
    timeline
      .draw()
      .then(() => {
        error.value = null
      })
      .catch((err) => {
        error.value = String(err)
      })
  }

  const onResize = useDebounceFn(
    ({ inlineSize, blockSize }: ResizeObserverSize) => {
      canvasSize.height = blockSize * 0.8
      canvasSize.width = inlineSize
      nextTick().then(drawTimeline)
    },
    200
  )

  useResizeObserver(cardElem, (entries) => {
    for (const entry of entries) {
      if (entry.contentBoxSize?.length) {
        cardHeight.value = entry.contentBoxSize[0].blockSize
        onResize(entry.contentBoxSize[0])
      }
    }
  })

  useIntervalFn(drawTimeline, timelineRefreshMillis)
})

await init(wasmUrl)
</script>

<style module lang="scss">
.rootContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
