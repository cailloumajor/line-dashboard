<template>
  <QCard ref="cardElem" class="column" data-cy="timeline-container">
    <div v-show="error === null">
      <canvas
        ref="canvasElem"
        data-cy="timeline-canvas"
        :height="canvasSize.height"
        :width="canvasSize.width"
      >
      </canvas>
      <div class="row justify-center" data-cy="legend" :style="legendStyle">
        <div
          v-for="(item, index) in legend"
          :key="`legend-${index}`"
          class="row items-center"
        >
          <div
            :class="`bg-${item.color}`"
            :style="legendBoxStyle"
            data-cy="legend-box"
          ></div>
          <div>{{ item.text }}</div>
        </div>
      </div>
    </div>
    <div
      v-show="error != null"
      :style="errorStyle"
      class="q-my-auto text-center text-negative"
      data-cy="timeline-error"
    >
      {{ error }}
    </div>
  </QCard>
</template>

<script setup lang="ts">
import { useDebounceFn, useResizeObserver } from "@vueuse/core"
import { mande } from "mande"
import { QCard } from "quasar"
import { computed, nextTick, onMounted, reactive, ref } from "vue"

import { isMandeError, timelineRefreshMillis } from "src/global"
import { useCampaignDataStore } from "src/stores/campaign-data"

import wasmUtils from "./frontend-utils-wasm"

import type { ResizeObserverSize } from "@vueuse/core"

interface LegendItem {
  color: string
  text: string
}

const { init, wasmUrl, Timeline } = wasmUtils

const props = defineProps<{
  computeApiUrl: string
  palette: string[]
  opacity: number
  xIntervalMinutes: number
  xOffsetMinutes: number
  emphasisLabels: string[]
  legend: LegendItem[]
}>()

const campaignDataStore = useCampaignDataStore()

const cardElem = ref<InstanceType<typeof QCard> | null>(null)
const canvasElem = ref<HTMLCanvasElement | null>(null)

const canvasSize = reactive({
  height: 150,
  width: 300,
})

const cardHeight = ref(0)

const error = ref<string | null>(null)

const legendStyle = computed(() => ({
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
  const { palette, opacity, xIntervalMinutes, xOffsetMinutes, emphasisLabels } =
    props
  const timeline = new Timeline(canvasElem.value, {
    palette,
    fontFamily,
    opacity,
    xIntervalMinutes,
    xOffsetMinutes,
    emphasisLabels,
  })

  const drawTimeline = () => {
    mande(props.computeApiUrl)
      .get({
        query: {
          targetCycleTime: campaignDataStore.targetCycleTime,
        },
        responseAs: "response",
      })
      .then((response) => {
        return response.arrayBuffer()
      })
      .then((buffer) => {
        const data = new Uint8Array(buffer)
        return timeline.draw(data)
      })
      .then(() => {
        error.value = null
      })
      .catch((err) => {
        if (isMandeError(err)) {
          error.value = `fetch error: ${err.message}`
        } else {
          error.value = String(err)
        }
      })
  }

  const onResize = useDebounceFn(
    ({ inlineSize, blockSize }: ResizeObserverSize) => {
      canvasSize.height = blockSize * 0.8
      canvasSize.width = inlineSize
      nextTick().then(drawTimeline)
    },
    200,
  )

  setTimeout(() => {
    useResizeObserver(cardElem, (entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize?.length) {
          cardHeight.value = entry.contentBoxSize[0].blockSize
          onResize(entry.contentBoxSize[0])
        }
      }
    })
    setInterval(drawTimeline, timelineRefreshMillis)
  }, 200)
})

await init(wasmUrl)
</script>
