import { defineStore } from "pinia"

export const useCampaignDataStore = defineStore("campaign-data", {
  state: () => ({
    currentCampaign: "?",
    dataValidForCampaign: "!INVALID!",
    targetCycleTime: 60, // TODO: restore to 0 after implementing
  }),

  actions: {
    updateCampaign(newCampaign: string) {
      this.currentCampaign = newCampaign
    },
  },
})
