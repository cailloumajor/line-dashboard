import { defineStore } from "pinia"

export const useCampaignDataStore = defineStore("campaign-data", {
  state: () => ({
    currentCampaign: "?",
    targetCycleTime: 0,
    targetEfficiency: 0,
  }),

  actions: {
    updateCampaign(newCampaign: string) {
      this.currentCampaign = newCampaign
    },
  },
})
