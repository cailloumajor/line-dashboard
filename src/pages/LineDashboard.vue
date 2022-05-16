<template>
  <q-page ref="pageElem" :class="$style.page">
    <dashboard-metric
      v-for="(metric, index) in metrics"
      :key="`metric-${index}`"
      :value="metric.value"
      :color="metric.color"
      :data-valid="fieldDataLinkStatusStore.dataValid"
      :data-cy="`metric-${index}`"
      :style="{ height: cardHeight * 0.95 + 'px' }"
    >
      <q-icon :name="metric.iconName" :class="$style.iconStyle" />
      {{ metric.title }}
    </dashboard-metric>
    <q-card :class="$style.statusCard" class="column text-center">
      <div :class="$style.statusText">STATUS</div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useWindowSize } from "@vueuse/core"
import { mande } from "mande"
import { computed, reactive, ref } from "vue"
import { useI18n } from "vue-i18n"

import DashboardMetric from "components/DashboardMetric.vue"
import fieldDataComposable from "composables/field-data"
import { lineDashboardConfigApi } from "src/global"
import { lineDashboardConfigSchema } from "src/schemas"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"
import { useFieldDataLinkStatusStore } from "src/stores/field-data"

import type { QPage } from "quasar"

const fixedFractional = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const props = defineProps<{
  id: string
}>()

const { t } = useI18n({
  useScope: "global",
  inheritLocale: true,
})
const commonStore = useCommonLineInterfaceConfigStore()
const { fieldDataLinkBoot } = fieldDataComposable.useFieldDataLinkBoot()
const fieldDataLinkStatusStore = useFieldDataLinkStatusStore()
const { height: windowHeight } = useWindowSize()

const pageElem = ref<InstanceType<typeof QPage> | null>(null)

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

const fieldData = reactive({
  goodParts: 0,
  scrapParts: 0,
  cycleTime: 0,
})

const targetCycleTime = ref(0)
const effectiveness = ref(0)

const metrics = computed(() => {
  const cycleTimeRatio = fieldData.cycleTime / targetCycleTime.value

  return [
    {
      iconName: "done_outline",
      title: t("goodParts"),
      value: fieldData.goodParts,
    },
    {
      iconName: "timer",
      title: t("cycleTime"),
      value: fixedFractional.format(fieldData.cycleTime),
      color:
        cycleTimeRatio >= 1.1 || fieldData.cycleTime <= 0
          ? "negative"
          : cycleTimeRatio >= 1.05
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
      value: fieldData.scrapParts,
      color: fieldData.scrapParts > 0 ? "negative" : "positive",
    },
    {
      iconName: "speed",
      title: t("oee"),
      value: fixedFractional.format(effectiveness.value),
    },
  ]
})

const resp = await mande(lineDashboardConfigApi).get(props.id)
const config = await lineDashboardConfigSchema.parseAsync(resp)
commonStore.title = config.title

const { centrifugoNamespace, opcUaNodeIds, opcUaNsURI } = config
fieldDataLinkBoot(fieldData, opcUaNodeIds, centrifugoNamespace, opcUaNsURI)
</script>

<style module lang="scss">
$grid-gap: 5vh 7vw;

.page {
  display: grid;
  gap: $grid-gap;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  padding: $grid-gap;
}

.iconStyle {
  margin-right: 0.5vw;
}

.statusCard {
  grid-area: 2 / 2 / 4 / 4;
  height: 60%;
  width: 100%;
  margin: auto;
}

.statusText {
  font-size: 10vh;
  margin-top: auto;
  margin-bottom: auto;
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
