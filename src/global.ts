export const staticConfigApi = "/static-config-api/config/machines"
export const influxdbPath = "/influxdb/api/v2/query"

export const centrifugoNamespace = "opcua.data"

export const loadingErrorStorageKey = "loading-error"

export const shiftDurationMillis = 8 * 60 * 60 * 1000

export const timelineRefreshMillis = 60_000

export enum LinkStatus {
  Unknown,
  Down,
  Up,
}
