import { boot } from "quasar/wrappers"

export default boot(() => {
  if (process.env.NODE_ENV === "development") {
    import("../dev-api-server").then((pkg) => {
      pkg.makeServer({ environment: "development" })
    })
  }
})
