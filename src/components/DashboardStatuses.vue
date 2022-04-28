<template>
  <span
    v-for="(status, index) in statuses"
    :key="`status-${index}`"
    :data-cy="`status-${index}`"
    class="q-ml-md"
  >
    <q-icon :name="status.icon" :color="status.color" size="sm" />
    {{ status.text }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue"

import { LinkStatus } from "src/global"
import { useLineDashboardStore } from "src/stores/line-dashboard"

const store = useLineDashboardStore()

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
    { text: "Centrifugo", ...graphical(store.centrifugoStatus) },
    { text: "OPC-UA proxy", ...graphical(store.opcUaProxyStatus) },
    { text: "OPC-UA", ...graphical(store.opcUaStatus) },
  ]
})
</script>
