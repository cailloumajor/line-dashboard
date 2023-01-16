import { refAutoReset } from "@vueuse/core"
import { Centrifuge } from "centrifuge"
import { onUnmounted, watch } from "vue"

import errorRedirectComposable from "composables/error-redirect"
import { LinkStatus, centrifugoNamespace } from "src/global"
import { useCampaignDataStore } from "stores/campaign-data"
import { useMachineDataLinkStatusStore } from "stores/machine-data-link"

import type {
  PublicationContext,
  SubscribedContext,
  TransportEndpoint,
} from "centrifuge"

export const heartbeatTimeoutMillis = 8000 // PLC heartbeat timeout in milliseconds

export const deps = { Centrifuge }

interface MachineData {
  val: object
  ts: Record<string, string>
}

function useMachineDataLinkBoot() {
  const { errorRedirect } = errorRedirectComposable.useErrorRedirect()
  const campaignDataStore = useCampaignDataStore()
  const statusStore = useMachineDataLinkStatusStore()

  /**
   * Boots the machine data link.
   *
   * @param machineData Reactive data to keep up-to-date with machine data.
   * @param partnerID Partner ID.
   */
  function machineDataLinkBoot<T extends MachineData>(
    machineData: T,
    partnerID: string
  ) {
    const upToDate = refAutoReset(false, heartbeatTimeoutMillis)
    watch(upToDate, (newValue) => {
      statusStore.plcLinkStatus = newValue ? LinkStatus.Up : LinkStatus.Down
    })

    function patchMachineData({
      data,
    }: SubscribedContext | PublicationContext) {
      // Return if data is null, undefined or not an object
      if (data == null || typeof data !== "object") return
      Object.assign(machineData.val, data.val)
      Object.assign(machineData.ts, data.ts)
      if ("heartbeat" in (data.val ?? {})) {
        statusStore.plcHeartbeat = !!data.val.heartbeat
      }
      if ("partRef" in (data.val ?? {})) {
        campaignDataStore.updateCampaign(data.val.partRef)
      }
      upToDate.value = true
    }

    const transports: TransportEndpoint[] = [
      {
        transport: "websocket",
        endpoint: `ws://${window.location.host}/centrifugo/connection/websocket`,
      },
      {
        transport: "sse",
        endpoint: `http://${window.location.host}/centrifugo/connection/sse`,
      },
    ]
    const centrifuge = new deps.Centrifuge(transports, {
      name: `Frontend (${partnerID})`,
      debug: import.meta.env.DEV,
      emulationEndpoint: `http://${window.location.host}/centrifugo/emulation`,
      maxReconnectDelay: 5000,
    })

    // Centrifugo link status
    centrifuge.on("connected", (ctx) => {
      statusStore.centrifugoLinkStatus = LinkStatus.Up
      statusStore.centrifugoTransport = ctx.transport
    })
    centrifuge.on("disconnected", () => {
      statusStore.centrifugoLinkStatus = LinkStatus.Down
      statusStore.centrifugoTransport = ""
    })

    // Data change subscription
    const opcDataChangeSubscription = centrifuge.newSubscription(
      `${centrifugoNamespace}:${partnerID}`
    )
    opcDataChangeSubscription.on("subscribed", patchMachineData)
    opcDataChangeSubscription.on("unsubscribed", ({ reason }) => {
      errorRedirect([reason])
    })
    opcDataChangeSubscription.on("publication", patchMachineData)
    opcDataChangeSubscription.subscribe()

    centrifuge.connect()

    onUnmounted(() => {
      centrifuge.disconnect()
    })
  }

  return { machineDataLinkBoot }
}

export default { useMachineDataLinkBoot }
