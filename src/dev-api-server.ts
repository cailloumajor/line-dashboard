import { createServer } from "miragejs"

export function makeServer({ environment = "test" } = {}) {
  return createServer({
    environment,

    routes() {
      this.get("/couchdb/line-interface/:id", () => ({
        title: "Test Title",
      }))
    },
  })
}
