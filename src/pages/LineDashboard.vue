<template>
  <q-page :class="$style.page">
    <dashboard-metric
      v-for="(metric, index) in metrics"
      :key="`metric-${index}`"
      :value="metric.value"
      :color="metric.color"
      :data-valid="fieldDataLinkStatusStore.dataValid"
      :page-height="pageHeight"
      :data-cy="`metric-${index}`"
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
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"

import DashboardMetric from "components/DashboardMetric.vue"
import fieldDataComposable from "composables/field-data"
import { lineDashboardConfigApi } from "src/global"
import { lineDashboardConfigSchema } from "src/schemas"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"
import { useFieldDataLinkStatusStore } from "src/stores/field-data"

interface Metric {
  iconName: string
  title: string
  value: number
  color?: string
}

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
const { height: pageHeight } = useWindowSize()

const fieldData = ref({
  goodParts: 0,
  scrapParts: 0,
  cycleTime: 0,
})

const targetCycleTime = ref(0)

const cycleTimeRatio = computed(
  () => fieldData.value.cycleTime / targetCycleTime.value
)

const metrics = computed<Metric[]>(() => [
  {
    iconName: "done_outline",
    title: t("goodParts"),
    value: fieldData.value.goodParts,
  },
  {
    iconName: "timer",
    title: t("cycleTime"),
    value: fieldData.value.cycleTime,
    color:
      cycleTimeRatio.value >= 1.1 || fieldData.value.cycleTime <= 0
        ? "negative"
        : cycleTimeRatio.value >= 1.05
        ? "warning"
        : "positive",
  },
  {
    iconName: "track_changes",
    title: t("targetCycleTime"),
    value: targetCycleTime.value,
  },
  {
    iconName: "delete_outline",
    title: t("scrapParts"),
    value: fieldData.value.scrapParts,
    color: fieldData.value.scrapParts > 0 ? "negative" : "positive",
  },
  {
    iconName: "speed",
    title: t("oee"),
    value: 0,
  },
])

const resp = await mande(lineDashboardConfigApi).get(props.id)
const config = await lineDashboardConfigSchema.parseAsync(resp)
commonStore.title = config.title

fieldDataLinkBoot(fieldData)
</script>

<style module lang="scss">
$grid-gap: 2vmax 7vmax;

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
