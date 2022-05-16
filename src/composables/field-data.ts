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
import { useFieldDataLinkStatusStore } from "src/stores/field-data"

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

function useFieldDataLinkBoot() {
  const { errorRedirect } = errorRedirectComposable.useErrorRedirect()
  const statusStore = useFieldDataLinkStatusStore()

  /**
   * Boots the field data link.
   *
   * @param fieldData Reactive data to keep up-to-date with field data.
   * @param nodeIds An object optionaly mapping field data properties to OPC-UA
   *   node ID. If a field data property is undefined, the node ID will be the
   *   field data object property.
   * @param centrifugoNamespace Centrifugo namespace.
   * @param opcUaNsUri OPC-UA namespace URI.
   */
  function fieldDataLinkBoot<T extends Record<string, unknown>>(
    fieldData: T,
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

    const fieldDataProps = Object.keys(fieldData)
    const nodes = fieldDataProps.map((key) => nodeIds[key] ?? key)

    const opcDataChangeSubscription = centrifuge.subscribe(
      `${centrifugoNamespace}:dashboard@1000`,
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
              fieldDataProps[parseInt(k, 10)],
              v,
            ])
          )
        )
      )
      .subscribe((patch) => {
        Object.assign(fieldData, patch)
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

  return { fieldDataLinkBoot }
}

export default { useFieldDataLinkBoot }
