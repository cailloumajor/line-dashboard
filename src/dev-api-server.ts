import { createServer } from "miragejs"

import { lineDashboardConfigApi } from "src/global"

export function makeServer({ environment = "test" } = {}) {
  return createServer({
    environment,

    trackRequests: environment === "test",

    routes() {
      this.get(`${lineDashboardConfigApi}/:id`, () => ({
        title: "Test Title",
      }))
    },
  })
}
