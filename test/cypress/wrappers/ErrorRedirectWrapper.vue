<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <textarea v-model="errors" data-cy="errors-input" rows="3" />
  <div><button @click="action" data-cy="action-button">REDIRECT</button></div>
</template>

<script setup lang="ts">
import { ref } from "vue"

import errorRedirectComposable from "../../../src/composables/error-redirect"

const { errorRedirect } = errorRedirectComposable.useErrorRedirect()

const errors = ref("")

function action() {
  errorRedirect(errors.value.split("\n"))
}
</script>
