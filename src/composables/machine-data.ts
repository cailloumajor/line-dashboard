import { autoResetRef } from "@vueuse/core"
import { Centrifuge } from "centrifuge"
import { onUnmounted, watch } from "vue"

import errorRedirectComposable from "composables/error-redirect"
import { LinkStatus, centrifugoNamespace } from "src/global"
import { useMachineDataLinkStatusStore } from "src/stores/machine-data"

import type { PublicationContext, SubscribedContext } from "centrifuge"
import type { UnwrapNestedRefs } from "vue"

export const heartbeatTimeoutMillis = 8000 // PLC heartbeat timeout in milliseconds

export const deps = { Centrifuge }

function useMachineDataLinkBoot() {
  const { errorRedirect } = errorRedirectComposable.useErrorRedirect()
  const statusStore = useMachineDataLinkStatusStore()

  /**
   * Boots the machine data link.
   *
   * @param machineData Reactive data to keep up-to-date with machine data.
   * @param partnerID Partner ID.
   */
  function machineDataLinkBoot<T extends object>(
    machineData: UnwrapNestedRefs<T>,
    partnerID: string
  ) {
    const upToDate = autoResetRef(false, heartbeatTimeoutMillis)
    watch(upToDate, (newValue) => {
      statusStore.plcLinkStatus = newValue ? LinkStatus.Up : LinkStatus.Down
    })

    function patchMachineData({
      data,
    }: SubscribedContext | PublicationContext) {
      Object.assign(machineData, data)
      upToDate.value = true
    }

    const url = `ws://${window.location.host}/centrifugo/connection/websocket`
    const centrifuge = new deps.Centrifuge(url, {
      debug: import.meta.env.DEV,
      maxReconnectDelay: 5000,
    })

    // Centrifugo link status
    centrifuge.on("connected", () => {
      statusStore.centrifugoLinkStatus = LinkStatus.Up
    })
    centrifuge.on("disconnected", () => {
      statusStore.centrifugoLinkStatus = LinkStatus.Down
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
