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
        <q-space />
        <router-view name="statuses" />
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar"
import { onErrorCaptured } from "vue"
import { useI18n } from "vue-i18n"
import { ZodError } from "zod"

import errorRedirectComposable from "composables/error-redirect"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"

import type { MandeError } from "mande"

const $q = useQuasar()
const configStore = useCommonLineInterfaceConfigStore()
const { errorRedirect } = errorRedirectComposable.useErrorRedirect()
const { t } = useI18n({
  useScope: "global",
  inheritLocale: true,
})

$q.dark.set(true)

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

<style lang="scss">
$footer-height: 30px;

.q-footer .q-toolbar {
  min-height: $footer-height;
  height: $footer-height;
}
</style>
