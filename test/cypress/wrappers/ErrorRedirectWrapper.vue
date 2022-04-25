<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <textarea v-model="errors" data-cy="errors-input" />
  <div><button @click="action" data-cy="action-button">REDIRECT</button></div>
</template>

<script setup lang="ts">
import { ref } from "vue"

import { useErrorRedirect } from "../../../src/composables/error-redirect"

const { errorRedirect } = useErrorRedirect()

const errors = ref("")

function action() {
  errorRedirect(errors.value.split("\n"))
}
</script>
