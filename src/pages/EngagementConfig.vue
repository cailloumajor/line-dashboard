<template>
  <div class="q-ma-lg">
    <QBanner
      v-if="errorText"
      class="error-banner bg-red text-white"
      data-cy="error-banner"
    >
      {{ errorText }}
    </QBanner>
    <div v-else>
      <div class="shifts-table">
        <div
          v-for="(header, headerIndex) in headers"
          :key="`header-${headerIndex}`"
          :class="{ 'first-shift-header': headerIndex === 0 }"
          class="header-cell text-center text-weight-medium q-mt-auto"
          data-cy="header-cell"
        >
          {{ header }}
        </div>
        <template
          v-for="(row, rowIndex) in linesConfiguration"
          :key="`engagement-row-${rowIndex}`"
        >
          <div
            class="engagement-row-title q-mr-md q-my-auto text-right text-weight-medium"
            data-cy="engagement-row-title"
          >
            {{ row.title }}
          </div>
          <div
            v-for="(shift, shiftIndex) in row.shifts"
            :key="`row-${rowIndex}-col-${shiftIndex}`"
            :class="{
              'bg-blue-1': Math.floor(shiftIndex / 3) % 2 === 0,
              'bg-blue-grey-1': Math.floor(shiftIndex / 3) % 2 === 1,
            }"
            class="text-center q-py-sm vertical-border"
          >
            <QCheckbox v-model="shift.engaged" data-cy="checkbox" dense />
          </div>
        </template>
      </div>
      <div class="row flex-center q-gutter-md q-mt-sm">
        <QBtn
          color="grey-6"
          data-cy="check-all-button"
          icon="check_box"
          :label="t('checkAll')"
          @click="switchAll(true)"
        />
        <QBtn
          color="grey-6"
          data-cy="uncheck-all-button"
          icon="check_box_outline_blank"
          :label="t('uncheckAll')"
          @click="switchAll(false)"
        />
        <QBtn
          color="primary"
          data-cy="save-button"
          icon="save"
          :disable="disableSubmit || !allInputsValid"
          :label="t('save')"
          @click="submit"
        />
      </div>
      <div class="row flex-center">
        <QMarkupTable class="q-mt-lg" dense>
          <thead>
            <th></th>
            <th>{{ t("cycleTime") }}</th>
            <th>{{ t("efficiency") }}</th>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in linesConfiguration"
              :key="`efficiency-row-${rowIndex}`"
            >
              <td
                class="text-right text-weight-medium"
                data-cy="capacity-table-row-header"
              >
                {{ row.title }}
              </td>
              <td>
                <div class="row flex-center">
                  <QInput
                    ref="cycleTimeInputRefs"
                    v-model.number="row.targetCycleTime"
                    :error-message="t('invalid')"
                    :rules="[isPositive]"
                    dense
                    outlined
                    size="3"
                    data-cy="cycle-time-input"
                  />
                </div>
              </td>
              <td>
                <div class="row flex-center">
                  <QInput
                    ref="efficiencyInputRefs"
                    :error-message="t('invalid')"
                    :model-value="efficiencyPercent(row.targetEfficiency)"
                    :rules="[isPositive, isMaxHundred]"
                    dense
                    outlined
                    size="3"
                    data-cy="efficiency-input"
                    @update:model-value="
                      (value) => setEfficicency(value, rowIndex)
                    "
                  />
                  <!-- (row.targetEfficiency = parseFloat(String(value)) / 100) -->
                </div>
              </td>
            </tr>
          </tbody>
        </QMarkupTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mande } from "mande"
import { useQuasar } from "quasar"
import { QInput } from "quasar"
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { ZodError } from "zod"

import { configApiPath } from "src/global"
import {
  engagementCommonConfigSchema,
  engagementPartnerConfigSchema,
} from "src/schemas"
import { useUserFacingLayoutStore } from "src/stores/user-facing-layout"

interface LineConfiguration {
  id: string
  title: string
  shifts: {
    engaged: boolean
  }[]
  targetCycleTime: number
  targetEfficiency: number
}

const props = defineProps<{
  zone: string
}>()

const $q = useQuasar()
const { t, rt, getLocaleMessage } = useI18n()
const layoutStore = useUserFacingLayoutStore()

const firstDay = ref("Monday")
const shifts = ref(["0"])
const firstShiftIndex = ref(0)

const cycleTimeInputRefs = ref<QInput[]>([])
const efficiencyInputRefs = ref<QInput[]>([])

const allInputsValid = computed(() =>
  [cycleTimeInputRefs.value, efficiencyInputRefs.value]
    .flat()
    .every((input) => !input.hasError),
)

const headers = computed(() => {
  const enWeekDays = getLocaleMessage("en-US").weekDays
  const firstDayIndex = enWeekDays
    .map((message) => rt(message))
    .findIndex((enDay) =>
      firstDay.value.toLowerCase().startsWith(enDay.toLowerCase()),
    )

  return [...Array(21)].map((value, index) => {
    const shiftIndex = (index + firstShiftIndex.value) % shifts.value.length
    const dayIndex =
      (Math.floor(index / shifts.value.length) + firstDayIndex) %
      enWeekDays.length
    const dayText = shiftIndex === 0 ? t(`weekDays[${dayIndex}]`) + "\n" : ""
    return dayText + shifts.value[shiftIndex]
  })
})

const linesConfiguration = ref<LineConfiguration[]>([])
const errorText = ref("")
const disableSubmit = ref(false)

const isPositive = (value: number) => value > 0

const isMaxHundred = (value: number) => value <= 100

function efficiencyPercent(rawValue: number) {
  return Math.floor(rawValue * 1000) / 10
}

function setEfficicency(value: string | number | null, rowIndex: number) {
  if (!value) {
    return
  }
  linesConfiguration.value[rowIndex].targetEfficiency =
    Math.floor(parseFloat(String(value)) * 10) / 1000
}

function switchAll(state: boolean) {
  for (const row of linesConfiguration.value) {
    for (const shift of row.shifts) {
      shift.engaged = state
    }
  }
}

function submit() {
  disableSubmit.value = true
  Promise.all(
    linesConfiguration.value.map(
      ({ id, shifts, targetCycleTime, targetEfficiency }) =>
        configApi.patch(id, {
          shiftEngaged: shifts.map(({ engaged }) => engaged),
          targetCycleTime,
          targetEfficiency,
        }),
    ),
  )
    .then(() => {
      setTimeout(() => {
        disableSubmit.value = false
      }, 2000)
    })
    .catch((err) => {
      $q.notify({
        type: "negative",
        message: String(err),
        onDismiss: () => {
          disableSubmit.value = false
        },
      })
    })
}

layoutStore.titleExtension = t("linesEngagement")

const configApi = mande(configApiPath)

configApi
  .get("/common")
  .then((resp) => engagementCommonConfigSchema.parseAsync(resp))
  .then((commonConfig) => {
    firstDay.value = commonConfig.weekStart.day
    shifts.value = commonConfig.shiftStartTimes.map((time) =>
      time.replace(/:\d\d$/, ""),
    )
    firstShiftIndex.value = commonConfig.weekStart.shiftIndex
    return Promise.all(
      commonConfig.partnerGroups[props.zone].map((partner) =>
        configApi
          .get(partner)
          .then((resp) => engagementPartnerConfigSchema.parseAsync(resp))
          .then((config) => ({ id: partner, config })),
      ),
    )
  })
  .then((partnerConfigs) => {
    linesConfiguration.value = partnerConfigs.map(
      ({
        id,
        config: { title, shiftEngaged, targetCycleTime, targetEfficiency },
      }) => ({
        id,
        title,
        shifts: shiftEngaged.map((engaged) => ({ engaged })),
        targetCycleTime,
        targetEfficiency,
      }),
    )
  })
  .catch((err) => {
    if (err instanceof ZodError) {
      errorText.value = JSON.stringify(err.format(), null, 4)
    } else {
      errorText.value = String(err)
    }
  })
</script>

<style lang="scss" scoped>
.shifts-table {
  display: grid;
  grid-template-columns: min-content repeat(21, 1fr);
}

.first-shift-header {
  grid-column-start: 2;
}

.header-cell {
  position: relative;
  left: -50%;
  white-space: pre-line;
}

.vertical-border {
  border-left: 2px solid gray;
}

.engagement-row-title {
  grid-column-start: 1;
  white-space: nowrap;
}

.error-banner {
  white-space: pre;
}
</style>
