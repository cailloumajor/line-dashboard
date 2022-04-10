import { z } from "zod"

export const commonLineInterfaceConfigSchema = z.object({
  title: z.string(),
})
