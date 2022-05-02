import { useQuasar } from "quasar"
import { useRouter } from "vue-router"

import { loadingErrorStorageKey } from "src/global"

function useErrorRedirect() {
  const $q = useQuasar()
  const router = useRouter()

  function errorRedirect(errors: string[]) {
    $q.sessionStorage.set(loadingErrorStorageKey, errors)
    router.push({ name: "loadingError", query: { autoback: 30 } })
  }

  return { errorRedirect }
}

export default { useErrorRedirect }
