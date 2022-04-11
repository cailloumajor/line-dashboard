<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <template v-if="config !== undefined">
    <div data-cy="first-param">First param: {{ config.params.first }}</div>
    <div data-cy="second-param">Second param: {{ config.params.second }}</div>
    <div
      v-for="(item, index) in config.list"
      :key="`item-${index}`"
      data-cy="list"
    >
      {{ item }}
    </div>
  </template>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { z } from "zod"

import { useLineInterfaceConfig } from "../../../src/composables/line-interface-config"
import { commonLineInterfaceConfigSchema } from "../../../src/schemas"

const schema = commonLineInterfaceConfigSchema.extend({
  params: z.object({
    first: z.string().min(1),
    second: z.boolean(),
  }),
  list: z.array(z.number()),
})

export default defineComponent({
  props: {
    id: String,
  },
  setup(props) {
    const { config } = useLineInterfaceConfig(props.id, schema)

    return { config }
  },
})
</script>
