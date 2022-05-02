import type { Ref } from "vue"

type OpcUaNodeId = number | string
export type FieldData = Ref<Record<OpcUaNodeId, unknown>>

function useFieldDataLinkBoot() {
  function fieldDataLinkBoot(fieldData: FieldData) {
    return undefined
  }

  return { fieldDataLinkBoot }
}

export default { useFieldDataLinkBoot }
