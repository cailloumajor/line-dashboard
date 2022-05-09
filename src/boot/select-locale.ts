import { pickLocale } from "locale-matcher"
import { Quasar } from "quasar"
import langPacksIndex from "quasar/lang/index.json"
import { boot } from "quasar/wrappers"

import { i18n } from "boot/i18n"

const langPacks = import.meta.glob("../../node_modules/quasar/lang/*.mjs")

export default boot(async () => {
  const setLocale = async () => {
    const { languages } = navigator
    if (!Array.isArray(languages)) return

    const quasarLocale = pickLocale(
      languages,
      langPacksIndex.map((lang) => lang.isoName)
    )
    if (quasarLocale !== undefined) {
      try {
        const langPkg = await langPacks[
          `../../node_modules/quasar/lang/${quasarLocale}.mjs`
        ]()
        Quasar.lang.set(langPkg.default)
      } catch (err) {
        // Requested Quasar Language Pack does not exist,
        // let's not break the app, so catching error
      }
    }

    const vueI18nLocale = pickLocale(languages, i18n.global.availableLocales)
    if (vueI18nLocale !== undefined) {
      i18n.global.locale.value = vueI18nLocale
    }
  }

  await setLocale()
  window.addEventListener("languagechange", setLocale)
})
