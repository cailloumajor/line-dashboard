<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <label>
    Raw query:
    <textarea id="raw-query-input" v-model="rawQuery" rows="13"></textarea>
  </label>
  <div>
    <button data-cy="action-button" @click="action">GET FLUX QUERY</button>
  </div>
  <div>Output:</div>
  <div id="query-output">{{ output }}</div>
</template>

<script setup lang="ts">
import { ref } from "vue"

import fluxQueryComposable from "../../../src/composables/flux-query"

const { makeFluxQuery } = fluxQueryComposable.useFluxQuery()

const rawQuery = ref("")
const output = ref("")

function action() {
  const params = {
    first: "somevalue",
    second: 42,
  }

  output.value = makeFluxQuery(rawQuery.value, params)
}
</script>

<style scoped lang="scss">
#raw-query-input {
  width: 100%;
}

#query-output {
  border: 1px solid black;
  min-height: 1em;
  white-space: pre;
}
</style>
