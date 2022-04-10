import { mount } from "@cypress/vue"
import { createTestingPinia } from "@pinia/testing"

import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"

import LineInterfaceLayout from "../LineInterfaceLayout.vue"

describe("DashboardLayout", () => {
  it("sets dark mode on", () => {
    mount(LineInterfaceLayout)

    cy.get("body").should("have.class", "body--dark")
  })

  it("gets its title from the common line interface config store", () => {
    mount(LineInterfaceLayout, {
      global: {
        plugins: [createTestingPinia({ createSpy: Cypress.sinon.spy })],
      },
    })

    cy.dataCy("layout-title").as("title")

    cy.get("@title").should("have.text", "⏳")

    cy.wrap(useCommonLineInterfaceConfigStore()).invoke("$patch", {
      title: "Test Title",
    })

    cy.get("@title").should("have.text", "Test Title")
  })
})
