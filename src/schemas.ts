import { z } from "zod"

export const commonLineInterfaceConfigSchema = z.object({
  title: z.string(),
})

export const lineDashboardConfigSchema = commonLineInterfaceConfigSchema.extend(
  {
    targetCycleTime: z.number().positive(),
    targetEfficiency: z.number().positive(),
  },
)

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const

export const engagementCommonConfigSchema = z
  .object({
    partnerGroups: z.record(z.string(), z.array(z.string())),
    shiftStartTimes: z.array(z.string().time()).nonempty(),
    weekStart: z.object({
      day: z.enum(weekDays),
      shiftIndex: z.number().nonnegative(),
    }),
  })
  .refine(
    ({ shiftStartTimes, weekStart: { shiftIndex } }) =>
      shiftIndex < shiftStartTimes.length,
    { message: "Week start shift index is out of bounds" },
  )

export const engagementPartnerConfigSchema = z.object({
  title: z.string(),
  shiftEngaged: z.array(z.boolean()),
  targetCycleTime: z.number().nonnegative(),
  targetEfficiency: z.number().nonnegative(),
})
