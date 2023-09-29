import { Buffer } from "node:buffer"
import http from "node:http"

import history from "connect-history-api-fallback"
import express from "express"
import expressStaticGzip from "express-static-gzip"
import httpProxy from "http-proxy"

export const timelineData = [
  0x95, 0x92, 0xce, 0x1c, 0x18, 0xf8, 0x00, 0x00, 0x92, 0xce, 0x1c, 0x19, 0x4c,
  0x60, 0x01, 0x92, 0xce, 0x1c, 0x19, 0x92, 0xb0, 0xc0, 0x92, 0xce, 0x1c, 0x19,
  0xa0, 0xc0, 0x02, 0x92, 0xce, 0x1c, 0x19, 0xf5, 0x20, 0x03,
]

const centrifugoHostKey = "CENTRIFUGO_HOST"
const centrifugoHost = process.env[centrifugoHostKey]
if (!centrifugoHost) {
  throw new Error(`Missing ${centrifugoHostKey} environment variable`)
}

const app = express()
app.disable("etag")
const server = http.createServer(app)

const partnerConfigPatches = []
let changeOrigin = ""

// Proxy Centrifugo WebSocket
const centrifugoProxy = httpProxy.createProxyServer({
  target: `ws://${centrifugoHost}:8000`,
  ws: true,
})
server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/centrifugo")) {
    req.url = req.url.replace(/^\/centrifugo/, "")
    if (changeOrigin) {
      req.headers.origin = changeOrigin
      changeOrigin = ""
    }
    centrifugoProxy.ws(req, socket, head)
  }
})

// Proxy Centrifugo SSE
const centrifugoSSEProxy = httpProxy.createProxyServer({
  target: `http://${centrifugoHost}:8000`,
})
app.all(/\/centrifugo\/(emulation|connection\/sse)/, (req, res) => {
  req.url = req.url.replace(/^\/centrifugo/, "")
  centrifugoSSEProxy.web(req, res)
})

// Mock static configuration API
app.get("/config-api/config/line_dashboard/common", (req, res) => {
  res.json({
    partnerGroups: {
      "e2e-tests": ["one", "two"],
    },
    shiftStartTimes: ["05:30:00", "13:30:00", "21:30:00"],
    weekStart: {
      day: "Monday",
      shiftIndex: 0,
    },
  })
})
app
  .route("/config-api/config/line_dashboard/:id")
  .get((req, res) => {
    res.json({
      title: req.params.id,
      shiftEngaged: new Array(21).fill(true),
      targetCycleTime: 54.78,
      targetEfficiency: 0.844,
    })
  })
  .patch(express.json(), (req, res) => {
    partnerConfigPatches.push([req.params.id, req.body])
    res.end()
  })
app
  .route("/partner-config-patches")
  .get((req, res) => {
    res.json(partnerConfigPatches)
  })
  .delete((req, res) => {
    partnerConfigPatches.length = 0
    res.end()
  })

// Mock influxDB compute API
app.get("/compute-api/timeline/*", (req, res) => {
  res.type("application/msgpack")
  res.send(Buffer.from(timelineData, "base64"))
})
app.get("/compute-api/performance/*", (req, res) => {
  res.json(0)
})

app.put("/change-origin", express.text(), (req, res) => {
  changeOrigin = req.body
  res.end()
})

// Serve built static files
// Thanks to https://stackoverflow.com/a/44226999
const staticFiles = expressStaticGzip("dist/spa", {
  serveStatic: {
    cacheControl: false,
  },
})
app.use(staticFiles)
app.use(history())
app.use(staticFiles)

const port = 9090

server.listen(port, () => {
  console.log(`server listening on port ${port}`)
})
