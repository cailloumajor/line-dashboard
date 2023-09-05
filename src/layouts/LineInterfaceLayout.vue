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
        <span data-cy="centrifugo-status" class="q-ml-md">
          {{ statuses.centrifugo.text }}
          <span
            :class="[
              $style.centrifugoTransport,
              `text-${centrifugoTransport.color}`,
            ]"
            data-cy="centrifugo-transport"
            >{{ centrifugoTransport.text }}</span
          >
          <QIcon
            :name="statuses.centrifugo.icon"
            :color="statuses.centrifugo.color"
            size="sm"
          />
        </span>
        <span data-cy="plc-status" class="q-ml-md">
          {{ statuses.plc.text }}
          <QIcon
            :name="statuses.plc.icon"
            :color="statuses.plc.color"
            size="sm"
          />
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
import { LinkStatus, isMandeError } from "src/global"
import { useCampaignDataStore } from "stores/campaign-data"
import { useCommonLineInterfaceConfigStore } from "stores/common-line-interface-config"
import { useMachineDataLinkStatusStore } from "stores/machine-data-link"

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

  return {
    centrifugo: {
      text: "Centrifugo",
      ...graphical(statusStore.centrifugoStatus),
    },
    plc: {
      text: "PLC",
      ...graphical(statusStore.plcStatus),
    },
  }
})

const centrifugoTransport = computed(() => {
  const transport =
    {
      websocket: "WS",
      sse: "SSE",
    }[statusStore.centrifugoTransport] ?? ""
  const text = transport && `(${transport})`
  const color = transport === "WS" ? "positive" : "warning"

  return { text, color }
})

onErrorCaptured((err) => {
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
      }),
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

.centrifugoTransport {
  font-weight: bold;
}
</style>

<style lang="scss">
$footer-height: 30px;

.q-footer .q-toolbar {
  min-height: $footer-height;
  height: $footer-height;
}
</style>
