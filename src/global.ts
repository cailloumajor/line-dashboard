import type { MandeError } from "mande"

export const configApiPath = "/config-api/config/line_dashboard"
export const computeApiPath = "/compute-api"

export const centrifugoNamespace = "opcua.data"

export const loadingErrorStorageKey = "loading-error"

export const shiftDurationMillis = 8 * 60 * 60 * 1000

export const timelineRefreshMillis = 60_000

export enum LinkStatus {
  Unknown,
  Down,
  Up,
}

interface MachineDataValues {
  goodParts: number
  scrapParts: number
  averageCycleTime: number
  campChange: boolean
  cycle: boolean
  cycleTimeOver: boolean
  fault: boolean
}

export interface MachineData {
  val: MachineDataValues
  ts: {
    [K in keyof MachineDataValues]: string
  }
}

export const isMandeError = (err: Error): err is MandeError => {
  return "body" in err && "response" in err
}
