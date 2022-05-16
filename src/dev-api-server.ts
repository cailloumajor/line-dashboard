import { createServer } from "miragejs"

import { lineDashboardConfigApi } from "src/global"

const maybeJSON = (s: string | undefined) => (s ? JSON.parse(s) : {})

export function makeServer({ environment = "test" } = {}) {
  return createServer({
    environment,

    trackRequests: environment === "test",

    routes() {
      this.get(`${lineDashboardConfigApi}/:id`, (schema, request) => ({
        title: "Test Title",
        centrifugoNamespace: request.params.id,
        opcUaNsURI: "urn:test",
        opcUaNodeIds: {},
        ...maybeJSON(import.meta.env.VITE_CONFIG_API as string),
      }))
    },
  })
}
