// Global type definitions for locales resources.
import "vue-i18n"

declare module "vue-i18n" {
  export interface DefineLocaleMessage {
    pageNotFound: string
    nothingHere: string
    goHome: string
    loadingError: string
    retryIn: string
    goodParts: string
    scrapParts: string
    averageCycleTime: string
    targetCycleTime: string
    performance: string
    fetchError: string
    stopped: string
    outOfProduction: string
    runUnderCadence: string
    runAtCadence: string
    campaignChange: string
    version: string
  }
}
