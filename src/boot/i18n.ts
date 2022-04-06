import messages from "@intlify/vite-plugin-vue-i18n/messages"
import { boot } from "quasar/wrappers"
import { createI18n } from "vue-i18n"

const i18n = createI18n<false>({
  legacy: false,
  messages,
})

export default boot(({ app }) => {
  app.use(i18n)
})

export { i18n }
