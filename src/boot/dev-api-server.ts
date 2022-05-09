import { boot } from "quasar/wrappers"

export default boot(() => {
  if (process.env.DEV && !process.env.TEST) {
    import("../dev-api-server").then((pkg) => {
      pkg.makeServer({ environment: "development" })
    })
  }
})
