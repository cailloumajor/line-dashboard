// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your component test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'component.supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import "./commands"
import "@cypress/code-coverage/support"

// Change this if you have a different entrypoint for the main scss.
import "src/css/app.scss"
// Quasar styles
import "quasar/src/css/index.sass"

// ICON SETS
// If you use multiple or different icon-sets then the default, be sure to import them here.
import "quasar/dist/icon-set/material-icons.umd.prod"
import "@quasar/extras/material-icons/material-icons.css"
import "quasar/dist/icon-set/material-icons-outlined.umd.prod"
import "@quasar/extras/material-icons-outlined/material-icons-outlined.css"

import { createTestingPinia } from "@pinia/testing"
import { installQuasarPlugin } from "@quasar/quasar-app-extension-testing-e2e-cypress"
import { VueTestUtils } from "cypress/vue"
import { mount } from "cypress/vue"
import { Dialog, Loading, Meta, SessionStorage } from "quasar"
import { createMemoryHistory, createRouter } from "vue-router"

import { i18n } from "src/boot/i18n"
import routes from "src/router/routes"

import type { TestingPinia } from "@pinia/testing"

// Since Cypress v10 we cannot import `config` directly from VTU as Cypress bundles its own version of it
// See https://github.com/cypress-io/cypress/issues/22611
const { config } = VueTestUtils

// You can modify the global config here for all tests or pass in the configuration per test
// For example use the actual i18n instance or mock it
config.global.plugins.push(i18n)

// Vue router
// https://docs.cypress.io/guides/component-testing/vue/examples#Vue-Router
Cypress.Commands.add("mount", (component, options = {}) => {
  // Setup options object
  options.global = options.global || {}
  options.global.plugins = options.global.plugins || []

  // create router if one is not provided
  const router =
    options.router ??
    createRouter({
      routes,
      history: createMemoryHistory(),
    })

  // Add router plugin
  options.global.plugins.push({
    install(app) {
      app.use(router)
    },
  })

  return mount(component, options)
})

// Pinia
let testingPinia: TestingPinia
beforeEach(() => {
  testingPinia = createTestingPinia({
    createSpy: Cypress.sinon.spy,
  })
  config.global.plugins.push(testingPinia)
})
afterEach(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== testingPinia,
  )
})

config.global.mocks = {
  // $t: () => "",
}

// Overwrite the transition and transition-group stubs which are stubbed by test-utils by default.
// We do want transitions to show when doing visual testing :)
config.global.stubs = {}

installQuasarPlugin({ plugins: { Dialog, Loading, Meta, SessionStorage } })
