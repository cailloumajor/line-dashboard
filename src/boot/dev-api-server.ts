import { boot } from "quasar/wrappers"

export default boot(() => {
  if (process.env.DEV && !process.env.TEST) {
    import("src/dev-api-server").then((pkg) => {
      pkg.makeServer({ environment: "development" })
    })
  }
})
