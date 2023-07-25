import { defineStore } from "pinia"

import type { commonLineInterfaceConfigSchema } from "src/schemas"
import type { TypeOf } from "zod"

export const useCommonLineInterfaceConfigStore = defineStore(
  "common-line-interface-config",
  {
    state: (): TypeOf<typeof commonLineInterfaceConfigSchema> => ({
      title: "⏳",
    }),
  },
)
