import { createServer } from "miragejs"

export function makeServer({ environment = "test" }) {
  return createServer({
    environment,

    routes() {
      this.get("/couchdb/line-dashboard/:id", () => ({
        title: "Test Title",
      }))
    },
  })
}
