<template>
  <QPage ref="pageElem" :class="[$style.page, stopped ? $style.stopped : '']">
    <DashboardMetric
      v-for="(metric, index) in metrics"
      v-show="rowsHeightValid"
      :key="`metric-${index}`"
      :value="metric.value"
      :color="metric.color"
      :data-valid="machineDataLinkStatusStore.dataValid"
      :disable-value="metric.disableValue"
      :data-cy="`metric-${index}`"
      :style="metricStyle"
    >
      <QIcon :name="metric.iconName" :class="$style.iconStyle" />
      <span class="text-uppercase" data-cy="metric-title-text">
        {{ metric.title }}
      </span>
      <span v-if="metric.unit" data-cy="metric-unit">
        ({{ metric.unit }})
      </span>
    </DashboardMetric>
    <QCard
      v-show="rowsHeightValid"
      :class="$style.statusCard"
      class="column q-my-auto text-center"
      data-cy="status-card"
    >
      <template v-if="machineDataLinkStatusStore.dataValid">
        <div
          :class="[$style.statusText, `text-${statusCard.color}`]"
          class="text-uppercase"
          data-cy="status-text"
        >
          {{ statusCard.text }}
        </div>
        <div
          v-if="statusCard.ts"
          :class="$style.statusDuration"
          data-cy="status-duration"
        >
          {{ statusDuration }}
        </div>
      </template>
      <QSkeleton v-else type="text" width="80%" class="q-mx-auto q-my-auto" />
    </QCard>
    <TimelineDisplay
      v-show="rowsHeightValid"
      :class="$style.timeline"
      :style="timelineStyle"
      :influxdb-org="config.influxdbOrg"
      :influxdb-token="config.influxdbToken"
      :flux-query="fluxQuery"
      :opacity="0.7"
      :x-interval-minutes="60"
      :x-offset-minutes="30"
      :emphasis-labels="['05:30', '13:30', '21:30']"
      :legend="timelineLegend"
      data-cy="timeline"
    />
  </QPage>
</template>

<script setup lang="ts">
import {
  useDebounceFn,
  useEventListener,
  useNow,
  usePreferredLanguages,
} from "@vueuse/core"
import { mande } from "mande"
import { QPage, colors } from "quasar"
import { computed, onMounted, reactive, ref } from "vue"
import { useI18n } from "vue-i18n"

import DashboardMetric from "components/DashboardMetric.vue"
import fluxQueryComposable from "composables/flux-query"
import machineDataComposable from "composables/machine-data"
import TimelineDisplay from "src/components/TimelineDisplay.vue"
import { configApiPath, shiftDurationMillis } from "src/global"
import { lineDashboardConfigSchema } from "src/schemas"
import { useCampaignDataStore } from "stores/campaign-data"
import { useCommonLineInterfaceConfigStore } from "stores/common-line-interface-config"
import { useMachineDataLinkStatusStore } from "stores/machine-data-link"

import type { MachineData } from "src/global"

enum CycleTimeStatus {
  Good,
  Warning,
  Error,
}

interface Status {
  text: string
  color: string
}

const props = defineProps<{
  id: string
}>()

const { t } = useI18n({
  useScope: "global",
  inheritLocale: true,
})
const campaignDataStore = useCampaignDataStore()
const commonStore = useCommonLineInterfaceConfigStore()
const { getPaletteColor } = colors
const { makeFluxQuery } = fluxQueryComposable.useFluxQuery()
const { machineDataLinkBoot } = machineDataComposable.useMachineDataLinkBoot()
const machineDataLinkStatusStore = useMachineDataLinkStatusStore()
const now = useNow({ interval: 1000 })
const languages = usePreferredLanguages()

const machineData = reactive<MachineData>({
  val: {
    goodParts: 0,
    scrapParts: 0,
    averageCycleTime: 0,
    campChange: false,
    cycle: false,
    cycleTimeOver: false,
    fault: false,
  },
  ts: {
    goodParts: "",
    scrapParts: "",
    averageCycleTime: "",
    campChange: "",
    cycle: "",
    cycleTimeOver: "",
    fault: "",
  },
})

const pageElem = ref<InstanceType<typeof QPage> | null>(null)

const productionObjective = ref(3500)

const stopped = computed(
  () =>
    machineDataLinkStatusStore.dataValid &&
    (!machineData.val.cycle || machineData.val.cycleTimeOver)
)

const effectiveness = computed(() => {
  const firstShiftEnd = +new Date(now.value).setHours(5, 30, 0, 0)
  const endMillis = [0, 1, 2, 3]
    .map((i) => firstShiftEnd + shiftDurationMillis * i)
    .find((shiftEnd) => +now.value < shiftEnd) as number
  const shiftElapsedMillis = +now.value - (endMillis - shiftDurationMillis)
  const shiftElapsedRatio = shiftElapsedMillis / shiftDurationMillis
  const expectedProductionNow = productionObjective.value * shiftElapsedRatio
  return (machineData.val.goodParts / expectedProductionNow) * 100
})

const rowsHeightValid = ref(false)
const rowsHeight = ref([0, 0, 0, 0])

const updateRowsHeight = () => {
  if (pageElem.value === null) {
    return
  }
  const { gridTemplateRows } = window.getComputedStyle(pageElem.value.$el)
  rowsHeight.value = gridTemplateRows.split(" ").map(parseFloat)
  rowsHeightValid.value = true
}
const debouncedUpdateRowHeight = useDebounceFn(updateRowsHeight, 200)

onMounted(updateRowsHeight)
useEventListener(
  "resize",
  () => {
    rowsHeightValid.value = false
    debouncedUpdateRowHeight()
  },
  { passive: true }
)

const metricStyle = computed(() => ({
  height: `${rowsHeight.value[0] * 0.95}px`,
}))
const metricTitleFontHeight = computed(() => `${rowsHeight.value[0] * 0.185}px`)
const metricValueFontHeight = computed(() => `${rowsHeight.value[0] * 0.7}px`)
const timelineStyle = computed(() => ({
  height: `${rowsHeight.value[3] * 0.95}px`,
}))

const cycleTime = computed(() => machineData.val.averageCycleTime / 10)
const cycleTimeStatus = computed(() => {
  if (cycleTime.value <= 0) {
    return CycleTimeStatus.Error
  }
  const ratio = cycleTime.value / campaignDataStore.targetCycleTime
  return ratio >= 1.1
    ? CycleTimeStatus.Error
    : ratio >= 1.05
    ? CycleTimeStatus.Warning
    : CycleTimeStatus.Good
})

const metrics = computed(() => {
  const fixedFractional = new Intl.NumberFormat(languages.value.slice(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  return [
    {
      iconName: "done_outline",
      title: t("metrics.goodParts"),
      value: machineData.val.goodParts,
    },
    {
      iconName: "timer",
      title: t("metrics.averageCycleTime"),
      unit: "s",
      value: fixedFractional.format(cycleTime.value),
      color:
        cycleTimeStatus.value === CycleTimeStatus.Error
          ? "negative"
          : cycleTimeStatus.value === CycleTimeStatus.Warning
          ? "warning"
          : "positive",
    },
    {
      iconName: "track_changes",
      title: t("metrics.targetCycleTime"),
      value: fixedFractional.format(campaignDataStore.targetCycleTime),
    },
    {
      iconName: "delete_outline",
      title: t("metrics.scrapParts"),
      value: machineData.val.scrapParts,
      color: machineData.val.scrapParts > 0 ? "negative" : "positive",
    },
    {
      iconName: "speed",
      title: t("metrics.performance"),
      unit: "%",
      value: fixedFractional.format(effectiveness.value),
      disableValue: true,
    },
  ]
})

const statusCard = computed(() =>
  machineData.val.cycle
    ? machineData.val.cycleTimeOver
      ? {
          text: t("statuses.stopped"),
          color: "negative",
          ts: machineData.ts.goodParts,
        }
      : cycleTimeStatus.value === CycleTimeStatus.Good
      ? { text: t("statuses.runAtCadence"), color: "positive" }
      : { text: t("statuses.runUnderCadence"), color: "warning" }
    : machineData.val.campChange
    ? {
        text: t("statuses.campaignChange"),
        color: "info",
        ts: machineData.ts.campChange,
      }
    : {
        text: t("statuses.stopped"),
        color: "negative",
        ts: machineData.ts.cycle,
      }
)

const reactiveNow = useNow({ interval: 1000 })
const statusDuration = computed(() => {
  const ts = statusCard.value.ts
  if (ts === undefined) {
    return
  }
  const elapsedMinutes = Math.floor(
    (reactiveNow.value.valueOf() - Date.parse(ts)) / 60_000
  )
  const hours = Math.floor(elapsedMinutes / 60)
  const minutes = elapsedMinutes % 60
  let duration = ""
  if (hours > 0) {
    const formattedHours = new Intl.NumberFormat(languages.value.slice(), {
      style: "unit",
      unit: "hour",
    }).format(hours)
    duration += formattedHours + " "
  }
  const formattedMinutes = new Intl.NumberFormat(languages.value.slice(), {
    style: "unit",
    unit: "minute",
  }).format(minutes)
  duration += formattedMinutes
  const since = new Date(ts).toLocaleString()
  return t("statusDuration", { duration, since })
})

const resp = await mande(configApiPath).get(props.id)
const config = await lineDashboardConfigSchema.parseAsync(resp)
commonStore.title = config.title

const { default: rawQuery } = await import("assets/timeline-query.flux?raw")
const fluxQuery = makeFluxQuery(rawQuery, {
  subcadenceColor: getPaletteColor("warning"),
  cycleColor: getPaletteColor("positive"),
  campChangeColor: getPaletteColor("info"),
  stoppedColor: getPaletteColor("negative"),
  bucket: config.influxdbBucket,
  id: props.id,
})

const timelineLegend = computed<Status[]>(() => [
  { text: t("statuses.runAtCadence"), color: "positive" },
  { text: t("statuses.runUnderCadence"), color: "warning" },
  { text: t("statuses.campaignChange"), color: "info" },
  { text: t("statuses.stopped"), color: "negative" },
])

machineDataLinkBoot(machineData, props.id)
</script>

<style module lang="scss">
@use "sass:color";

$grid-gap: 3vh 7vw;

.page {
  display: grid;
  gap: $grid-gap;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 3fr) 4fr;
  padding: $grid-gap;
}

.stopped {
  $bgcolor: red;
  $first-stripe-color: color.change($bgcolor, $alpha: 0.5);
  $second-stripe-color: color.change($bgcolor, $alpha: 0.3);
  $stripe-width: 1vw;
  background: repeating-linear-gradient(
    45deg,
    $first-stripe-color,
    $first-stripe-color $stripe-width,
    $second-stripe-color $stripe-width,
    $second-stripe-color $stripe-width * 2
  );
}

.iconStyle {
  margin-right: 0.5vw;
}

.statusCard {
  grid-area: 2 / 2 / 4 / 4;
  height: 80%;
  justify-content: space-evenly;
}

.statusText {
  font-size: min(10vh, 10vw);
  line-height: 1;
}

.statusDuration {
  font-size: min(4vh, 4vw);
}

.timeline {
  grid-column: 1/-1;
}
</style>

<style scoped lang="scss">
:deep(.metric-title) {
  font-size: v-bind(metricTitleFontHeight);
}

:deep(.metric-value) {
  font-size: v-bind(metricValueFontHeight);
}
</style>
