import { defineStore } from "pinia"

import { LinkStatus } from "src/global"

export const useMachineDataLinkStatusStore = defineStore("machine-data-link", {
  state: () => ({
    centrifugoLinkStatus: LinkStatus.Unknown,
    opcUaProxyLinkStatus: LinkStatus.Unknown,
    opcUaLinkStatus: LinkStatus.Unknown,
  }),

  getters: {
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
