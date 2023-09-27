import { defineStore } from "pinia"
import { ref } from "vue"

export const useUserFacingLayoutStore = defineStore(
  "user-facing-layout",
  () => {
    const titleExtension = ref("")

    return { titleExtension }
  },
)
