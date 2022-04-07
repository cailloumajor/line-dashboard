import { mount } from "@cypress/vue"

import { loadingErrorStorageKey } from "src/constants"

import ErrorDashboardLogging from "../ErrorDashboardLoading.vue"

describe("ErrorDashboardLogging", () => {
  it("does display error text", () => {
    cy.window()
      .then((win) => {
        win.sessionStorage.setItem(
          loadingErrorStorageKey,
          '["first error","second error","third error"]'
        )
      })
      .its("sessionStorage")
      .invoke("getItem", loadingErrorStorageKey)
      .should("not.be.null")

    mount(ErrorDashboardLogging)

    cy.dataCy("error").should(($el) => {
      expect($el).to.have.length(3)
      expect($el.get(0)).to.have.text("first error")
      expect($el.get(1)).to.have.text("second error")
      expect($el.get(2)).to.have.text("third error")
    })
  })

  it("does not display the countdown when no time is passed", () => {
    mount(ErrorDashboardLogging)

    cy.dataCy("countdown").should("be.hidden")
  })

  it("shows a countdown line when a time is passed", () => {
    mount(ErrorDashboardLogging, {
      props: {
        autoback: 10,
      },
    })

    cy.dataCy("countdown").should("contain.text", " 10 ")
  })

  it("routes to previous page when countdown elapses", () => {
    cy.clock()

    mount(ErrorDashboardLogging, {
      props: {
        autoback: 1,
      },
    })
      .its("router")
      .then((router) => {
        router.back = Cypress.sinon.spy()

        return undefined
      })
      .its("back")
      .as("back")

    cy.dataCy("countdown").should("contain.text", " 1 ")
    cy.get("@back").should("not.have.been.called")

    cy.tick(1000)
    cy.dataCy("countdown").should("not.contain.text", " 1 ")
    cy.get("@back").should("have.been.calledOnce")
  })
})
