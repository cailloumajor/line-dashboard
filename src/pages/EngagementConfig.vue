<template>
  <div class="q-ma-lg">
    <QBanner
      v-if="errorText"
      class="error-banner bg-red text-white"
      data-cy="error-banner"
    >
      {{ errorText }}
    </QBanner>
    <div>
      <div class="container">
        <div><!-- Do not remove, used to shift headers by one position --></div>
        <div
          v-for="(header, headerIndex) in headers"
          :key="`header-${headerIndex}`"
          class="header-cell text-center text-weight-medium q-mt-auto"
          data-cy="header-cell"
        >
          {{ header }}
        </div>
        <template
          v-for="(row, rowIndex) in linesEngagement"
          :key="`row-${rowIndex}`"
        >
          <div
            class="row-title q-mr-md q-my-auto text-right text-weight-medium"
            data-cy="row-title"
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
            class="shift-cell text-center q-py-sm"
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
          :disable="disableSubmit"
          :label="t('save')"
          @click="submit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mande } from "mande"
import { useQuasar } from "quasar"
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { ZodError } from "zod"

import { configApiPath } from "src/global"
import {
  engagementCommonConfigSchema,
  engagementPartnerConfigSchema,
} from "src/schemas"
import { useUserFacingLayoutStore } from "src/stores/user-facing-layout"

interface LineEngagement {
  id: string
  title: string
  shifts: {
    engaged: boolean
  }[]
}

const props = defineProps<{
  zone: string
}>()

const $q = useQuasar()
const { t, rt, getLocaleMessage } = useI18n()
const layoutStore = useUserFacingLayoutStore()

console.log(getLocaleMessage("en-US"))

const firstDay = ref("Monday")
const shifts = ref(["0"])
const firstShiftIndex = ref(0)

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

const linesEngagement = ref<LineEngagement[]>([])
const errorText = ref("")
const disableSubmit = ref(false)

function switchAll(state: boolean) {
  for (const row of linesEngagement.value) {
    for (const shift of row.shifts) {
      shift.engaged = state
    }
  }
}

function submit() {
  disableSubmit.value = true
  Promise.all(
    linesEngagement.value.map(({ id, shifts }) =>
      configApi.patch(id, {
        shiftEngaged: shifts.map(({ engaged }) => engaged),
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
    linesEngagement.value = partnerConfigs.map(
      ({ id, config: { title, shiftEngaged } }) => ({
        id,
        title,
        shifts: shiftEngaged.map((engaged) => ({ engaged })),
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
.container {
  display: grid;
  grid-template-columns: min-content repeat(21, 1fr);
}

.header-cell {
  position: relative;
  left: -50%;
  white-space: pre-line;
}

.shift-cell {
  border-left: 2px solid gray;
}

.row-title {
  grid-column-start: 1;
  white-space: nowrap;
}

.error-banner {
  white-space: pre;
}
</style>
