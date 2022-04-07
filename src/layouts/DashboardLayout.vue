<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-grey-9 text-white">
      <q-toolbar>
        <q-toolbar-title class="text-center" data-cy="layout-title">
          {{ title }}
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view @change-title="(val: string) => (title = val)" />
    </q-page-container>

    <q-footer elevated class="bg-grey-10 text-white">
      <q-toolbar></q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar"
import { ref } from "vue"

const $q = useQuasar()

$q.dark.set(true)

const title = ref("⏳")
</script>

<style lang="scss">
$footer-height: 30px;

.q-footer .q-toolbar {
  min-height: $footer-height;
  height: $footer-height;
}
</style>
