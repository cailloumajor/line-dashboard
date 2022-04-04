import { pickLocale } from "locale-matcher"
import { Quasar } from "quasar"
import langPacksIndex from "quasar/lang/index.json"
import { boot } from "quasar/wrappers"

export default boot(() => {
  const setLocale = () => {
    const { languages } = navigator
    if (!Array.isArray(languages)) return

    const quasarLocale = pickLocale(
      languages,
      langPacksIndex.map((lang) => lang.isoName)
    )
    if (quasarLocale !== undefined) {
      const langPacks = import.meta.glob("../../node_modules/quasar/lang/*.mjs")
      langPacks[`../../node_modules/quasar/lang/${quasarLocale}.mjs`]().then(
        (langPkg) => {
          Quasar.lang.set(langPkg.default)
        }
      )
    }
  }

  setLocale()
  window.addEventListener("languagechange", setLocale)
})
