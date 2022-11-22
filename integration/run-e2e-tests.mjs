import http from "http"

import history from "connect-history-api-fallback"
import express from "express"
import httpProxy from "http-proxy"

const centrifugoHostKey = "CENTRIFUGO_HOST"
const centrifugoHost = process.env[centrifugoHostKey]
if (!centrifugoHost) {
  throw new Error(`Missing ${centrifugoHostKey} environment variable`)
}

const app = express()
const proxy = httpProxy.createProxyServer({
  target: `ws://${centrifugoHost}:8000`,
  ws: true,
})
const server = http.createServer(app)

// Proxy WebSockets
const pathPrefix = "/centrifugo"
server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith(pathPrefix)) {
    req.url = req.url.slice(pathPrefix.length)
  }
  proxy.ws(req, socket, head)
})

// Mock static configuration API
app.get("/static-config-api/*", (req, res) => {
  res.json({
    title: "End-to-end tests",
  })
})

// Serve built static files
// Thanks to https://stackoverflow.com/a/44226999
const staticFiles = express.static("dist/spa")
app.use(staticFiles)
app.use(history())
app.use(staticFiles)

const port = 9090

server.listen(port, () => {
  console.log(`server listening on port ${port}`)
})
