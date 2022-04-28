import { defineStore } from "pinia"

import { LinkStatus } from "src/global"

export const useLineDashboardStore = defineStore("line-dashboard", {
  state: () => ({
    goodParts: 0,
    scrapParts: 0,
    cycleTime: 0,
    targetCycleTime: 0,
    centrifugoLinkStatus: LinkStatus.Unknown,
    opcUaProxyLinkStatus: LinkStatus.Unknown,
    opcUaLinkStatus: LinkStatus.Unknown,
  }),

  getters: {
    cycleTimeRatio: (state) => state.cycleTime / state.targetCycleTime,
    dataValid: (state) =>
      state.centrifugoLinkStatus === LinkStatus.Up &&
      state.opcUaProxyLinkStatus === LinkStatus.Up &&
      state.opcUaLinkStatus === LinkStatus.Up,
    centrifugoStatus: (state) => state.centrifugoLinkStatus,
    opcUaProxyStatus: (state) =>
      state.centrifugoLinkStatus === LinkStatus.Up
        ? state.opcUaProxyLinkStatus
        : LinkStatus.Unknown,
    opcUaStatus: (state) =>
      state.centrifugoLinkStatus === LinkStatus.Up &&
      state.opcUaProxyLinkStatus === LinkStatus.Up
        ? state.opcUaLinkStatus
        : LinkStatus.Unknown,
  },
})
