import { useSessionStorage } from "@vueuse/core"
import { useQuasar } from "quasar"
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { ZodError } from "zod"

import { loadingErrorStorageKey } from "src/constants"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"

import type { commonLineInterfaceConfigSchema } from "src/schemas"
import type { TypeOf } from "zod"

export function useLineInterfaceConfig<
  S extends typeof commonLineInterfaceConfigSchema
>(id: string, schema: S) {
  const $q = useQuasar()
  $q.loading.show()

  const router = useRouter()

  const store = useCommonLineInterfaceConfigStore()

  const errStorage = useSessionStorage(loadingErrorStorageKey, [""])
  errStorage.value = []

  const config = ref<TypeOf<S>>()

  onMounted(async () => {
    try {
      const resp = await fetch(`/couchdb/line-interface/${id}`)
      if (!resp.ok) {
        throw new Error(
          `Configuration fetch error: ${resp.status} - ${resp.statusText}`
        )
      }
      const parsed = schema.parse(await resp.json())
      store.$patch({
        title: parsed.title,
      })
      config.value = parsed
      $q.loading.hide()
    } catch (error) {
      $q.loading.hide()
      if (error instanceof SyntaxError) {
        errStorage.value.push(`JSON parse error: ${error.message}`)
      } else if (error instanceof ZodError) {
        errStorage.value.push(
          ...error.issues.map((issue) => {
            let path = "[Config Object]"
            for (const elem of issue.path) {
              if (typeof elem == "string") {
                path += `.${elem}`
              } else if (typeof elem == "number") {
                path += `[${elem}]`
              }
            }
            return `${path}: ${issue.message}`
          })
        )
      } else if (error instanceof Error) {
        errStorage.value.push(error.message)
      }
      router.push({ name: "loadingError", query: { autoback: 30 } })
    }
  })

  return { config }
}
