import { createServer } from "miragejs"

import { lineDashboardConfigApi } from "src/global"

const maybeJSON = (s: string | undefined) => (s ? JSON.parse(s) : {})

export function makeServer({ environment = "test" } = {}) {
  return createServer({
    environment,

    trackRequests: environment === "test",

    routes() {
      this.get(`${lineDashboardConfigApi}/:id`, () => ({
        title: "Test Title",
        opcUaNsURI: "urn:test",
        ...maybeJSON(process.env.CONFIG_API),
      }))
    },
  })
}
