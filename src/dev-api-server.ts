import { createServer } from "miragejs"

import { staticConfigApi } from "src/global"

const maybeJSON = (s: string | undefined) =>
  s && !Object.hasOwn(window, "Cypress") ? JSON.parse(s) : {}

export function makeServer({ environment = "test" } = {}) {
  return createServer({
    environment,

    routes() {
      this.get(`${staticConfigApi}/:id/line-dashboard`, () => ({
        title: "Test Title",
        influxdbOrg: "devOrg",
        influxdbToken: "devToken",
        influxdbBucket: "devBucket",
        ...maybeJSON(import.meta.env.VITE_CONFIG_API as string | undefined),
      }))

      // Following is a workaround, with huge thanks to
      // https://github.com/miragejs/miragejs/issues/339#issuecomment-613334649

      // Needed because Chrome recognizes that the Mirage Response is not a real response
      // with setting instantiateStreaming to null we fallback to legacy WebAssembly instantiation
      // this works with the Mirage Response, therefore the app can start
      // for more details see: https://github.com/miragejs/miragejs/issues/339
      Object.defineProperty(window.WebAssembly, "instantiateStreaming", {
        value: null,
      })
      const oldPassthroughRequest = this.pretender.passthroughRequest.bind(
        this.pretender
      )
      this.pretender.passthroughRequest = (verb, path, request) => {
        // Needed because responseType is not set correctly in Mirages passthrough
        // for more details see: https://github.com/miragejs/ember-cli-mirage/issues/1915
        if (verb === "GET" && path.endsWith(".wasm")) {
          console.log("Set responseType for WASM correctly")
          request.responseType = "arraybuffer"
        }
        return oldPassthroughRequest(verb, path, request)
      }
      this.passthrough()
    },
  })
}
