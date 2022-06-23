import Centrifuge from "centrifuge"
import {
  catchError,
  concatWith,
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  of,
  timeout,
} from "rxjs"
import { onUnmounted } from "vue"

import errorRedirectComposable from "composables/error-redirect"
import { LinkStatus } from "src/global"
import { useMachineDataLinkStatusStore } from "src/stores/machine-data"

import type { PublicationContext, SubscribeErrorContext } from "centrifuge"
import type { Observable } from "rxjs"

type OpcUaNodeId = string | number

interface DataChangePublication extends PublicationContext {
  data: Record<string, unknown>
}

export const heartbeatTimeout = 8000 // OPC-UA proxy heartbeat timeout in milliseconds

export const maybeUint32 = (s: string) => {
  const parsed = parseInt(s, 10)
  if (parsed >= 0 && parsed < 2 ** 32 - 1) {
    return parsed
  } else {
    return s
  }
}

export const deps = { Centrifuge }

function useMachineDataLinkBoot() {
  const { errorRedirect } = errorRedirectComposable.useErrorRedirect()
  const statusStore = useMachineDataLinkStatusStore()

  /**
   * Boots the machine data link.
   *
   * @param machineData Reactive data to keep up-to-date with machine data.
   * @param nodeIds An object optionaly mapping machine data properties to
   *   OPC-UA node ID. If a machine data property is undefined, the node ID will
   *   be the machine data object property.
   * @param centrifugoNamespace Centrifugo namespace.
   * @param opcUaNsUri OPC-UA namespace URI.
   */
  function machineDataLinkBoot<T extends Record<string, unknown>>(
    machineData: T,
    nodeIds: Partial<Record<keyof T, OpcUaNodeId>>,
    centrifugoNamespace: string,
    opcUaNsUri: string
  ) {
    const url = `ws://${window.location.host}/centrifugo/connection/websocket`
    const centrifuge = new deps.Centrifuge(url, {
      debug: import.meta.env.DEV,
      maxRetry: 5000,
    })

    // Centrifugo link status
    merge(
      fromEvent(centrifuge, "connect").pipe(map(() => LinkStatus.Up)),
      fromEvent(centrifuge, "disconnect").pipe(map(() => LinkStatus.Down))
    ).subscribe((status) => {
      statusStore.centrifugoLinkStatus = status
    })

    const machineDataProps = Object.keys(machineData)
    const nodes = machineDataProps.map((key) => nodeIds[key] ?? key)

    const opcDataChangeSubscription = centrifuge.subscribe(
      `${centrifugoNamespace}:machine-data@1000`,
      undefined,
      { data: { namespaceURI: opcUaNsUri, nodes } }
    )
    opcDataChangeSubscription.on("error", (context: SubscribeErrorContext) => {
      if (!context.isResubscribe) {
        errorRedirect([context.message])
      }
    })
    const opcDataPublication$ = fromEvent(
      opcDataChangeSubscription,
      "publish"
    ) as Observable<DataChangePublication>

    // OPC-UA data change
    opcDataPublication$
      .pipe(
        map(({ data }) =>
          Object.fromEntries(
            Object.entries(data).map<[string, unknown]>(([k, v]) => [
              machineDataProps[parseInt(k, 10)],
              v,
            ])
          )
        )
      )
      .subscribe((patch) => {
        Object.assign(machineData, patch)
      })

    interface HeartbeatPublication extends PublicationContext {
      data: {
        status: number
        description: string
      }
    }

    const heartbeatSubscription = centrifuge.subscribe(
      `${centrifugoNamespace}:heartbeat`
    )
    const heartbeatPublication$ = fromEvent(
      heartbeatSubscription,
      "publish"
    ) as Observable<HeartbeatPublication>

    // OPC-UA proxy link status
    merge(heartbeatPublication$, opcDataPublication$)
      .pipe(
        map(() => LinkStatus.Up),
        timeout(heartbeatTimeout),
        catchError((err, caught) =>
          of(LinkStatus.Down).pipe(concatWith(caught))
        ),
        distinctUntilChanged()
      )
      .subscribe((status) => {
        statusStore.opcUaProxyLinkStatus = status
      })

    // OPC-UA link status
    heartbeatPublication$
      .pipe(
        map(({ data: { status } }) =>
          status === 0 ? LinkStatus.Up : LinkStatus.Down
        )
      )
      .subscribe((status) => {
        statusStore.opcUaLinkStatus = status
      })

    // Connect at the end
    centrifuge.connect()

    onUnmounted(() => {
      centrifuge.disconnect()
    })
  }

  return { machineDataLinkBoot }
}

export default { useMachineDataLinkBoot }
