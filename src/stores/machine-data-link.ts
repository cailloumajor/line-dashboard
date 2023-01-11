import { defineStore } from "pinia"

import { LinkStatus } from "src/global"

export const useMachineDataLinkStatusStore = defineStore("machine-data-link", {
  state: () => ({
    centrifugoLinkStatus: LinkStatus.Unknown,
    plcLinkStatus: LinkStatus.Unknown,
    plcHeartbeat: false,
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
    heartbeat(): boolean {
      return this.plcStatus === LinkStatus.Up && this.plcHeartbeat
    },
  },
})
