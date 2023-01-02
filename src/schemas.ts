import { z } from "zod"

export const commonLineInterfaceConfigSchema = z.object({
  title: z.string(),
})

export const lineDashboardConfigSchema = commonLineInterfaceConfigSchema.extend(
  {
    influxdbOrg: z.string(),
    influxdbToken: z.string(),
    influxdbBucket: z.string(),
  }
)
