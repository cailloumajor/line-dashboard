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
    cycleTime: string
    targetCycleTime: string
    oee: string
    fetchError: string
    stopFault: string
    stopNoFault: string
    runUnderCadence: string
    runAtCadence: string
  }
}
