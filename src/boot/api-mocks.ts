import { boot } from "quasar/wrappers"

export default boot(async () => {
  if (process.env.DEV && !process.env.TEST) {
    const { worker } = await import("../api-mocks")
    worker.start()
  }
})
