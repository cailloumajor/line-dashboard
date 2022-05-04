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

import type { PublicationContext } from "centrifuge"
import type { Observable } from "rxjs"

export type FieldData = Record<string, unknown>

interface SubscribeErrorContext {
  code: number
  message: string
  channel: string
  isResubscribe: boolean
}

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

  function fieldDataLinkBoot(
    fieldData: FieldData,
    ns: string,
    namespaceURI: string
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

    const nodes = Object.keys(fieldData).map(maybeUint32)

    const opcDataChangeSubscription = centrifuge.subscribe(
      `${ns}:dashboard@1000`,
      undefined,
      { data: { namespaceURI, nodes } }
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
            Object.entries(data).map<[string | number, unknown]>(([k, v]) => [
              nodes[parseInt(k, 10)],
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

    const heartbeatSubscription = centrifuge.subscribe(`${ns}:heartbeat`)
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