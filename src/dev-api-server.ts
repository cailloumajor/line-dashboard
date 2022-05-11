import { createServer } from "miragejs"

import { lineDashboardConfigApi } from "src/global"

import type { Router } from "vue-router"

export function makeServer({
  environment = "test",
  router,
}: { environment?: string; router?: Router } = {}) {
  return createServer({
    environment,

    trackRequests: environment === "test",

    routes() {
      this.get(`${lineDashboardConfigApi}/:id`, () => ({
        title: "Test Title",
        opcUaNsURI: "urn:test",
        ...router?.currentRoute.value.query,
      }))
    },
  })
}
