import { mount } from "@cypress/vue"

import TitleEmit from "app/test/cypress/wrappers/TitleEmit.vue"

import DashboardLayout from "../DashboardLayout.vue"

describe("DashboardLayout", () => {
  it("sets dark mode on", () => {
    mount(DashboardLayout)

    cy.get("body").should("have.class", "body--dark")
  })

  it("sets the title when child emits", () => {
    mount(DashboardLayout, {
      global: {
        stubs: {
          RouterView: TitleEmit,
        },
      },
    })

    cy.dataCy("layout-title").as("title")

    cy.get("@title").should("have.text", "⏳")

    cy.dataCy("title-input").type("Test Title")
    cy.dataCy("title-send").click()
    cy.get("@title").should("have.text", "Test Title")
  })
})
