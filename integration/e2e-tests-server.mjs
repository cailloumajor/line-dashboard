import http from "node:http"

import history from "connect-history-api-fallback"
import express from "express"
import expressStaticGzip from "express-static-gzip"
import httpProxy from "http-proxy"

const centrifugoHostKey = "CENTRIFUGO_HOST"
const centrifugoHost = process.env[centrifugoHostKey]
if (!centrifugoHost) {
  throw new Error(`Missing ${centrifugoHostKey} environment variable`)
}

const influxDbHostKey = "INFLUXDB_HOST"
const influxDbHost = process.env[influxDbHostKey]
if (!influxDbHost) {
  throw new Error(`Missing ${influxDbHostKey} environment variable`)
}

const app = express()
const server = http.createServer(app)

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

// Proxy InfluxDB
const influxDbProxy = httpProxy.createProxyServer({
  target: `http://${influxDbHost}:8086`,
})
app.all("/influxdb/*", (req, res) => {
  req.url = req.url.replace(/^\/influxdb/, "")
  influxDbProxy.web(req, res)
})

// Mock static configuration API
app.get("/config-api/*", (req, res) => {
  res.json({
    title: "End-to-end tests",
    influxdbOrg: "e2e-tests-org",
    influxdbToken: "e2e-tests-token",
    influxdbBucket: "e2e-tests-bucket",
  })
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