import { z } from "zod"

export const commonLineInterfaceConfigSchema = z.object({
  title: z.string(),
})

export const lineDashboardConfigSchema = commonLineInterfaceConfigSchema.extend(
  {
    centrifugoNamespace: z.string(),
    opcUaNsURI: z.string(),
    opcUaNodeIds: z.object({}).catchall(
      z.union([
        z
          .number()
          .positive()
          .lt(2 ** 32),
        z.string(),
      ])
    ),
  }
)
