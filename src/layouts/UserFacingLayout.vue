<template>
  <QLayout view="lHh Lpr lFf">
    <QHeader elevated>
      <QToolbar>
        <QToolbarTitle data-cy="layout-title">
          {{ title }}
        </QToolbarTitle>
      </QToolbar>
    </QHeader>

    <QPageContainer>
      <RouterView />
    </QPageContainer>
  </QLayout>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"

import { useUserFacingLayoutStore } from "src/stores/user-facing-layout"

const { t } = useI18n()
const store = useUserFacingLayoutStore()

const title = computed(() =>
  [t("digitalFactory"), store.titleExtension].join("\u00a0—\u00a0"),
)
</script>
