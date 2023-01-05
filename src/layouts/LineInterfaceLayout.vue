<template>
  <QLayout view="hHh lpR fFf">
    <QHeader elevated class="bg-grey-9 text-white">
      <QToolbar>
        <QToolbarTitle class="text-center" data-cy="layout-title">
          {{
            configStore.title +
            "&nbsp;&mdash;&nbsp;" +
            campaignDataStore.currentCampaign
          }}
        </QToolbarTitle>
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <Suspense @pending="$q.loading.show" @resolve="$q.loading.hide">
        <RouterView />
      </Suspense>
    </QPageContainer>

    <QFooter elevated class="bg-grey-10 text-white">
      <QToolbar>
        <span :class="$style.version">{{ t("version") }}</span>
        <span>{{ appVersion }}</span>
        <QSpace />
        <span
          v-for="(status, index) in statuses"
          :key="`status-${index}`"
          :data-cy="`status-${index}`"
          class="q-ml-md"
        >
          {{ status.text }}
          <QIcon :name="status.icon" :color="status.color" size="sm" />
        </span>
        <QIcon
          :color="statusStore.heartbeat ? 'positive' : 'grey-7'"
          data-cy="heartbeat-icon"
          name="o_monitor_heart"
          size="sm"
        />
      </QToolbar>
    </QFooter>
  </QLayout>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar"
import { onErrorCaptured } from "vue"
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { ZodError } from "zod"

import errorRedirectComposable from "composables/error-redirect"
import { LinkStatus } from "src/global"
import { useCampaignDataStore } from "stores/campaign-data"
import { useCommonLineInterfaceConfigStore } from "stores/common-line-interface-config"
import { useMachineDataLinkStatusStore } from "stores/machine-data"

import type { MandeError } from "mande"

const appVersion = process.env.APP_VERSION ?? "unknown"

const $q = useQuasar()
const campaignDataStore = useCampaignDataStore()
const configStore = useCommonLineInterfaceConfigStore()
const { errorRedirect } = errorRedirectComposable.useErrorRedirect()
const { t } = useI18n({
  useScope: "global",
  inheritLocale: true,
})
const statusStore = useMachineDataLinkStatusStore()

$q.dark.set(true)

const statuses = computed(() => {
  const graphical = (status: LinkStatus) => ({
    color: {
      [LinkStatus.Unknown]: "warning",
      [LinkStatus.Down]: "negative",
      [LinkStatus.Up]: "positive",
    }[status],
    icon: {
      [LinkStatus.Unknown]: "question_mark",
      [LinkStatus.Down]: "link_off",
      [LinkStatus.Up]: "swap_horiz",
    }[status],
  })

  return [
    { text: "Centrifugo", ...graphical(statusStore.centrifugoStatus) },
    { text: "PLC", ...graphical(statusStore.plcStatus) },
  ]
})

onErrorCaptured((err) => {
  const isMandeError = (err: Error): err is MandeError => {
    return "body" in err && "response" in err
  }

  const errors: string[] = []

  if (isMandeError(err)) {
    const { url, status } = err.response
    const statusText = err.message
    errors.push(t("fetchError", { url, status, statusText }))
  } else if (err instanceof ZodError) {
    errors.push(
      ...err.issues.map((issue) => {
        let path = "[Config Object]"
        for (const elem of issue.path) {
          if (typeof elem == "string") {
            path += `.${elem}`
          } else if (typeof elem == "number") {
            path += `[${elem}]`
          }
        }
        return `${path}: ${issue.message}`
      })
    )
  } else {
    errors.push(String(err))
  }

  errorRedirect(errors)

  return false
})
</script>

<style module lang="scss">
.version {
  margin-right: 0.25em;
}
</style>

<style lang="scss">
$footer-height: 30px;

.q-footer .q-toolbar {
  min-height: $footer-height;
  height: $footer-height;
}
</style>
