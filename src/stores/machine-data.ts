import { defineStore } from "pinia"

import { LinkStatus } from "src/global"

export const useMachineDataLinkStatusStore = defineStore("machine-data-link", {
  state: () => ({
    centrifugoLinkStatus: LinkStatus.Unknown,
    plcLinkStatus: LinkStatus.Unknown,
  }),

  getters: {
    dataValid: (state) =>
      state.centrifugoLinkStatus === LinkStatus.Up &&
      state.plcLinkStatus === LinkStatus.Up,
    centrifugoStatus: (state) => state.centrifugoLinkStatus,
    plcStatus: (state) =>
      state.centrifugoLinkStatus === LinkStatus.Up
        ? state.plcLinkStatus
        : LinkStatus.Unknown,
  },
})
