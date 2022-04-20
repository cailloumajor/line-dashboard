<template>
  <div
    class="fullscreen bg-blue-grey-8 text-white text-center q-pa-md flex flex-center"
  >
    <div style="width: 90%">
      <q-icon name="error_outline" color="negative" size="8rem"></q-icon>

      <div style="font-size: 6rem">{{ t("loadingError").toUpperCase() }}</div>

      <q-card
        bordered
        class="bg-red-8 q-pa-sm q-mx-auto q-mb-xl text-left"
        style="opacity: 0.8; width: 60%"
      >
        <p
          v-for="(error, index) in errors"
          :key="`error-${index}`"
          :class="$style.errorLine"
          class="q-mb-xs"
          data-cy="error"
        >
          {{ error }}
        </p>
      </q-card>

      <div
        :style="countdownStyle"
        class="text-h2"
        style="opacity: 0.4"
        data-cy="countdown"
      >
        {{ t("retryIn", { n: countdown }, countdown) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "@vue/reactivity"
import { useIntervalFn, useSessionStorage, whenever } from "@vueuse/core"
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"

import { loadingErrorStorageKey } from "src/global"

import type { CSSProperties } from "vue"

const props = defineProps<{
  autoback?: number
}>()

const { t } = useI18n({
  useScope: "global",
  inheritLocale: true,
})

const errors = useSessionStorage(loadingErrorStorageKey, [""], {
  listenToStorageChanges: false,
  writeDefaults: false,
})

const countdownStyle = computed<CSSProperties>(() => ({
  visibility: props.autoback === undefined ? "hidden" : undefined,
}))

const countdown = ref(props.autoback ?? 0)

const router = useRouter()

if (props.autoback && props.autoback > 0) {
  const { pause } = useIntervalFn(() => {
    countdown.value--
  }, 1000)
  whenever(
    () => countdown.value <= 0,
    () => {
      pause()
      router.back()
    }
  )
}
</script>

<style module lang="scss">
.errorLine {
  font-size: 1rem;
  font-family: monospace;
  line-height: normal;
}
</style>
