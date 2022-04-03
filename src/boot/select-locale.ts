import { Quasar } from "quasar"
import langPacksIndex from "quasar/lang/index.json"
import { boot } from "quasar/wrappers"

export default boot(() => {
  const setLocale = () => {
    const { languages } = navigator
    if (!Array.isArray(languages)) return
    for (const lang of languages) {
      if (langPacksIndex.findIndex(({ isoName }) => isoName === lang) !== -1) {
        const langPacks = import.meta.glob(
          "../../node_modules/quasar/lang/*.mjs"
        )
        langPacks[`../../node_modules/quasar/lang/${lang}.mjs`]().then(
          (langPkg) => {
            Quasar.lang.set(langPkg.default)
          }
        )
        return
      }
    }
  }

  setLocale()
  window.addEventListener("languagechange", setLocale)
})
