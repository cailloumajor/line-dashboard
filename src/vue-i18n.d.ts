// Global type definitions for locales resources.
import "vue-i18n"

declare module "vue-i18n" {
  export interface DefineLocaleMessage {
    tuningInProgress: string
    pageNotFound: string
    nothingHere: string
    goHome: string
    loadingError: string
    retryIn: string
    fetchError: string
    version: string
    metrics: {
      goodParts: string
      scrapParts: string
      averageCycleTime: string
      targetCycleTime: string
      performance: string
    }
    statuses: {
      stopped: string
      outOfProduction: string
      runUnderCadence: string
      runAtCadence: string
      campaignChange: string
    }
    statusDuration: string
  }
}
