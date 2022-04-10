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
      <router-view />
    </q-page-container>

    <q-footer elevated class="bg-grey-10 text-white">
      <q-toolbar></q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar"

import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"

const $q = useQuasar()

$q.dark.set(true)

const configStore = useCommonLineInterfaceConfigStore()
</script>

<style lang="scss">
$footer-height: 30px;

.q-footer .q-toolbar {
  min-height: $footer-height;
  height: $footer-height;
}
</style>
