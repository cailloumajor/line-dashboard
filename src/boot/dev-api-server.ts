import { boot } from "quasar/wrappers"

export default boot(({ router }) => {
  if (process.env.DEV && !process.env.TEST) {
    import("../dev-api-server").then((pkg) => {
      pkg.makeServer({ environment: "development", router })
    })
  }
})
