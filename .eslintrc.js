const tsConfig = require("./tsconfig.json")

const internalPathPatterns = Object.keys(tsConfig.compilerOptions.paths)
  .filter((pat) => pat.endsWith("/*"))
  .map((pat) => pat.slice(0, -2))
  .join(",")
const internalPathGlob = `{${internalPathPatterns}}/**`

module.exports = {
  // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
  // This option interrupts the configuration hierarchy at this file
  // Remove this if you have an higher level ESLint config file (it usually happens into a monorepos)
  root: true,

  // https://eslint.vuejs.org/user-guide/#how-to-use-a-custom-parser
  // Must use parserOptions instead of "parser" to allow vue-eslint-parser to keep working
  // `parser: 'vue-eslint-parser'` is already included with any 'plugin:vue/**' config and should be omitted
  parserOptions: {
    parser: require.resolve("@typescript-eslint/parser"),
    extraFileExtensions: [".vue"],
  },

  env: {
    browser: true,
    es2021: true,
    node: true,
  },

  // Rules order is important, please avoid shuffling them
  extends: [
    // Base ESLint recommended rules
    // 'eslint:recommended',

    // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#usage
    // ESLint typescript rules
    "plugin:@typescript-eslint/recommended",

    // Uncomment any of the lines below to choose desired strictness,
    // but leave only one uncommented!
    // See https://eslint.vuejs.org/rules/#available-rules
    "plugin:vue/vue3-essential", // Priority A: Essential (Error Prevention)
    // 'plugin:vue/vue3-strongly-recommended', // Priority B: Strongly Recommended (Improving Readability)
    // 'plugin:vue/vue3-recommended', // Priority C: Recommended (Minimizing Arbitrary Choices and Cognitive Overhead)

    // https://github.com/prettier/eslint-config-prettier#installation
    // usage with Prettier, provided by 'eslint-config-prettier'.
    "prettier",

    "plugin:cypress/recommended",

    "plugin:@intlify/vue-i18n/recommended",
  ],

  plugins: [
    // required to apply rules which need type information
    "@typescript-eslint",

    // https://eslint.vuejs.org/user-guide/#why-doesn-t-it-work-on-vue-files
    // required to lint *.vue files
    "vue",

    "import",

    // https://github.com/typescript-eslint/typescript-eslint/issues/389#issuecomment-509292674
    // Prettier has not been included as plugin to avoid performance impact
    // add it as an extension for your IDE
  ],

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

  // add your custom rules here
  rules: {
    "prefer-promise-reject-errors": "off",

    quotes: ["warn", "double", { avoidEscape: true }],

    // this rule, if on, would require explicit return type on the `render` function
    "@typescript-eslint/explicit-function-return-type": "off",

    // in plain CommonJS modules, you can't use `import foo = require('foo')` to pass this rule, so it has to be disabled
    "@typescript-eslint/no-var-requires": "off",

    // enforce usage of type-only imports (recommended with Vite)
    // https://vitejs.dev/guide/features.html#typescript
    "@typescript-eslint/consistent-type-imports": "error",

    // The core 'no-unused-vars' rules (in the eslint:recommeded ruleset)
    // does not work with type definitions
    "no-unused-vars": "off",

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
