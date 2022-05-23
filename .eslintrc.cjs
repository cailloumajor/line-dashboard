const tsConfig = require("./tsconfig.json")
const internalPathPatterns = Object.keys(tsConfig.compilerOptions.paths)
  .filter((pat) => pat.endsWith("/*"))
  .map((pat) => pat.slice(0, -2))
  .join(",")
const internalPathGlob = `{${internalPathPatterns}}/**`

require("@rushstack/eslint-patch/modern-module-resolution")

module.exports = {
  root: true,

  env: {
    browser: true,
    es2021: true,
    node: true,
    "vue/setup-compiler-macros": true,
  },

  extends: [
    "plugin:vue/vue3-essential",
    "plugin:vue/vue3-strongly-recommended",
    "plugin:vue/vue3-recommended",

    "eslint:recommended",

    "@vue/eslint-config-typescript/recommended",
    "@vue/eslint-config-prettier",

    "plugin:cypress/recommended",

    "plugin:@intlify/vue-i18n/recommended",
  ],

  plugins: ["import"],

  globals: {
    ga: "readonly", // Google Analytics
    cordova: "readonly",
    __statics: "readonly",
    __QUASAR_SSR__: "readonly",
    __QUASAR_SSR_SERVER__: "readonly",
    __QUASAR_SSR_CLIENT__: "readonly",
    __QUASAR_SSR_PWA__: "readonly",
    process: "readonly",
    Capacitor: "readonly",
    chrome: "readonly",
    defineProps: "readonly", // Vue SFC setup compiler macro
    defineEmits: "readonly", // Vue SFC setup compiler macro
    defineExpose: "readonly", // Vue SFC setup compiler macro
  },
  rules: {
    quotes: ["warn", "double", { avoidEscape: true }],

    // enforce usage of type-only imports (recommended with Vite)
    // https://vitejs.dev/guide/features.html#typescript
    "@typescript-eslint/consistent-type-imports": "error",

    // allow debugger during development only
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",

    "import/order": [
      "error",
      {
        "newlines-between": "always",
        alphabetize: { order: "asc" },
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          "object",
          "type",
        ],
        pathGroups: [
          {
            pattern: internalPathGlob,
            group: "internal",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin", "type"],
      },
    ],

    "sort-imports": ["error", { ignoreDeclarationSort: true }],

    "@intlify/vue-i18n/no-raw-text": [
      "warn",
      {
        attributes: {
          "/.+/": [
            "title",
            "label",
            "aria-label",
            "aria-placeholder",
            "aria-roledescription",
            "aria-valuetext",
          ],
        },
        ignorePattern: "^[?]{3}$",
      },
    ],
  },

  settings: {
    "vue-i18n": {
      localeDir: "./src/locales/*.json",
      messageSyntaxVersion: "^9.0.0",
    },
  },
}
