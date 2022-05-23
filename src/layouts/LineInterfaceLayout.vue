<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-grey-9 text-white">
      <q-toolbar>
        <q-toolbar-title class="text-center" data-cy="layout-title">
          {{ configStore.title }}
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <Suspense @pending="$q.loading.show" @resolve="$q.loading.hide">
        <router-view />
      </Suspense>
    </q-page-container>

    <q-footer elevated class="bg-grey-10 text-white">
      <q-toolbar>
        <span :class="$style.version">{{ t("version") }}</span>
        <span>{{ appVersion }}</span>
        <q-space />
        <span
          v-for="(status, index) in statuses"
          :key="`status-${index}`"
          :data-cy="`status-${index}`"
          class="q-ml-md"
        >
          <q-icon :name="status.icon" :color="status.color" size="sm" />
          {{ status.text }}
        </span>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar"
import { onErrorCaptured } from "vue"
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { ZodError } from "zod"

import errorRedirectComposable from "composables/error-redirect"
import { LinkStatus } from "src/global"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"
import { useFieldDataLinkStatusStore } from "src/stores/field-data"

import type { MandeError } from "mande"

const appVersion = process.env.APP_VERSION ?? "unknown"

const $q = useQuasar()
const configStore = useCommonLineInterfaceConfigStore()
const { errorRedirect } = errorRedirectComposable.useErrorRedirect()
const { t } = useI18n({
  useScope: "global",
  inheritLocale: true,
})
const statusStore = useFieldDataLinkStatusStore()

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
    { text: "Pub/Sub", ...graphical(statusStore.centrifugoStatus) },
    { text: "OPC-UA proxy", ...graphical(statusStore.opcUaProxyStatus) },
    { text: "OPC-UA", ...graphical(statusStore.opcUaStatus) },
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
    throw err
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
