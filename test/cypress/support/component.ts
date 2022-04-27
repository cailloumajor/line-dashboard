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

import { createTestingPinia } from "@pinia/testing"
import { installQuasarPlugin } from "@quasar/quasar-app-extension-testing-e2e-cypress"
import { config } from "@vue/test-utils"
import { Dialog, Loading, SessionStorage } from "quasar"
import {
  VueRouterMock,
  createRouterMock,
  injectRouterMock,
} from "vue-router-mock"

import { i18n } from "src/boot/i18n"

import type { TestingPinia } from "@pinia/testing"

// You can modify the global config here for all tests or pass in the configuration per test
// For example use the actual i18n instance or mock it
config.global.plugins.push(i18n)

// vue-router-mock
const router = createRouterMock({
  spy: {
    create: (fn) => Cypress.sinon.spy(fn),
    reset: (spy) => spy.resetHistory(),
  },
})
const routerBackSpy = Cypress.sinon.spy(router.back)
router.back = routerBackSpy
beforeEach(() => {
  cy.wrap(router).as("router-mock")
  router.reset()
  routerBackSpy.resetHistory()
  injectRouterMock(router)
})
config.plugins.VueWrapper.install(VueRouterMock)

// Pinia
let testingPinia: TestingPinia
beforeEach(() => {
  testingPinia = createTestingPinia({
    createSpy: Cypress.sinon.spy,
    fakeApp: true,
  })
  config.global.plugins.push(testingPinia)
})
afterEach(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== testingPinia
  )
})

config.global.mocks = {
  // $t: () => "",
}

// Overwrite the transition and transition-group stubs which are stubbed by test-utils by default.
// We do want transitions to show when doing visual testing :)
config.global.stubs = {}

installQuasarPlugin({ plugins: { Dialog, Loading, SessionStorage } })
