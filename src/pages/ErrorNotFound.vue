<template>
  <div
    class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center"
  >
    <div>
      <div style="font-size: 8rem">{{ t("pageNotFound").toUpperCase() }}</div>

      <div class="text-h2" style="opacity: 0.4">{{ t("nothingHere") }}</div>

      <q-btn
        :label="t('goHome')"
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/"
        no-caps
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"

const { t } = useI18n({
  useScope: "global",
  inheritLocale: true,
})
</script>
