import { defineStore } from "pinia"

export const useCampaignDataStore = defineStore("campaign-data", {
  state: () => ({
    currentCampaign: "?",
    dataValidForCampaign: "!INVALID!",
    targetCycleTime: 0,
  }),

  actions: {
    updateCampaign(newCampaign: string) {
      this.currentCampaign = newCampaign
    },
  },
})
