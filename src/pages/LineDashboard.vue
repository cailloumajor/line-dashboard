<template>
  <q-page ref="pageElem" :class="[$style.page, stopped ? $style.stopped : '']">
    <dashboard-metric
      v-for="(metric, index) in metrics"
      :key="`metric-${index}`"
      :value="metric.value"
      :color="metric.color"
      :data-valid="machineDataLinkStatusStore.dataValid"
      :data-cy="`metric-${index}`"
      :style="{ height: cardHeight * 0.95 + 'px' }"
    >
      <q-icon :name="metric.iconName" :class="$style.iconStyle" />
      {{ metric.title }}
    </dashboard-metric>
    <q-card
      :class="$style.statusCard"
      class="column q-my-auto text-center"
      data-cy="status-card"
    >
      <div
        v-if="machineDataLinkStatusStore.dataValid"
        class="q-my-auto text-uppercase"
        data-cy="status-text"
        :class="`text-${statusCard.color}`"
      >
        {{ statusCard.text }}
      </div>
      <q-skeleton v-else type="text" width="80%" class="q-mx-auto q-my-auto" />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useNow, usePreferredLanguages, useWindowSize } from "@vueuse/core"
import { mande } from "mande"
import { QPage } from "quasar"
import { computed, reactive, ref } from "vue"
import { useI18n } from "vue-i18n"

import DashboardMetric from "components/DashboardMetric.vue"
import machineDataComposable from "composables/machine-data"
import { shiftDurationMillis, staticConfigApi } from "src/global"
import { lineDashboardConfigSchema } from "src/schemas"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"
import { useMachineDataLinkStatusStore } from "src/stores/machine-data"

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
const commonStore = useCommonLineInterfaceConfigStore()
const { machineDataLinkBoot } = machineDataComposable.useMachineDataLinkBoot()
const machineDataLinkStatusStore = useMachineDataLinkStatusStore()
const now = useNow({ interval: 1000 })
const languages = usePreferredLanguages()
const { height: windowHeight } = useWindowSize()

const machineData = reactive({
  goodParts: 0,
  scrapParts: 0,
  cycleTime: 0,
  inCycle: false,
  fault: false,
})

const pageElem = ref<InstanceType<typeof QPage> | null>(null)

const targetCycleTime = ref(25)
const productionObjective = ref(3500)

const stopped = computed(
  () => machineDataLinkStatusStore.dataValid && !machineData.inCycle
)

const effectiveness = computed(() => {
  const firstShiftEnd = +new Date(now.value).setHours(5, 30, 0, 0)
  const endMillis = [0, 1, 2, 3]
    .map((i) => firstShiftEnd + shiftDurationMillis * i)
    .find((shiftEnd) => +now.value < shiftEnd) as number
  const shiftElapsedMillis = +now.value - (endMillis - shiftDurationMillis)
  const shiftElapsedRatio = shiftElapsedMillis / shiftDurationMillis
  const expectedProductionNow = productionObjective.value * shiftElapsedRatio
  return (machineData.goodParts / expectedProductionNow) * 100
})

const cardHeight = computed(() => {
  if (pageElem.value === null) return 0
  const { paddingTop, paddingBottom, rowGap } = window.getComputedStyle(
    pageElem.value.$el
  )
  const topBarHeight = 50
  const bottomBarHeight = 30
  return Math.max(
    (windowHeight.value -
      topBarHeight -
      bottomBarHeight -
      parseFloat(paddingTop) -
      3 * parseFloat(rowGap) -
      parseFloat(paddingBottom)) /
      4,
    60
  )
})

const metricTitleFontHeight = computed(() => `${cardHeight.value * 0.185}px`)
const metricValueFontHeight = computed(() => `${cardHeight.value * 0.7}px`)

const cycleTimeRatio = computed(
  () => machineData.cycleTime / targetCycleTime.value
)

const metrics = computed(() => {
  const fixedFractional = new Intl.NumberFormat(languages.value.slice(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })

  return [
    {
      iconName: "done_outline",
      title: t("goodParts"),
      value: machineData.goodParts,
    },
    {
      iconName: "timer",
      title: t("cycleTime"),
      value: fixedFractional.format(machineData.cycleTime),
      color:
        cycleTimeRatio.value >= 1.1 || machineData.cycleTime <= 0
          ? "negative"
          : cycleTimeRatio.value >= 1.05
          ? "warning"
          : "positive",
    },
    {
      iconName: "track_changes",
      title: t("targetCycleTime"),
      value: fixedFractional.format(targetCycleTime.value),
    },
    {
      iconName: "delete_outline",
      title: t("scrapParts"),
      value: machineData.scrapParts,
      color: machineData.scrapParts > 0 ? "negative" : "positive",
    },
    {
      iconName: "speed",
      title: t("performance") + " (%)",
      value: fixedFractional.format(effectiveness.value),
    },
  ]
})

const statusCard = computed<Status>(() =>
  machineData.fault
    ? { text: t("stopFault"), color: "negative" }
    : !machineData.inCycle
    ? { text: t("stopNoFault"), color: "orange" }
    : cycleTimeRatio.value >= 1.05
    ? { text: t("runUnderCadence"), color: "warning" }
    : { text: t("runAtCadence"), color: "positive" }
)

const resp = await mande(staticConfigApi).get(`${props.id}/line-dashboard`)
const config = await lineDashboardConfigSchema.parseAsync(resp)
commonStore.title = config.title

const { centrifugoNamespace, opcUaNodeIds, opcUaNsURI } = config
machineDataLinkBoot(machineData, opcUaNodeIds, centrifugoNamespace, opcUaNsURI)
</script>

<style module lang="scss">
@use "sass:color";

$grid-gap: 5vh 7vw;

.page {
  display: grid;
  gap: $grid-gap;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
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
  font-size: min(10vh, 10vw);
  line-height: 1;
  grid-area: 2 / 2 / 4 / 4;
  height: 60%;
  width: 100%;
  margin: auto;
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
