import { boot } from "quasar/wrappers"
import { createI18n } from "vue-i18n"

import enUS from "src/locales/en-US.json"
import fr from "src/locales/fr.json"

const i18n = createI18n<false>({
  legacy: false,
  messages: {
    "en-US": enUS,
    fr,
  },
})

export default boot(({ app }) => {
  app.use(i18n)
})

export { i18n }
