import { SessionStorage } from "quasar"
import { createMemoryHistory, createRouter } from "vue-router"

import { loadingErrorStorageKey } from "src/global"

import ErrorDashboardLogging from "../ErrorDashboardLoading.vue"

describe("ErrorDashboardLogging", () => {
  it("does display error text", () => {
    cy.wrap(SessionStorage).invoke("set", loadingErrorStorageKey, [
      "first error",
      "second error",
      "third error",
    ])

    cy.mount(ErrorDashboardLogging)

    cy.dataCy("error").should(($el) => {
      expect($el).to.have.length(3)
      expect($el.get(0)).to.have.text("first error")
      expect($el.get(1)).to.have.text("second error")
      expect($el.get(2)).to.have.text("third error")
    })
  })

  it("does not display the countdown when no time is passed", () => {
    cy.mount(ErrorDashboardLogging)

    cy.dataCy("countdown").should("be.hidden")
  })

  it("shows a countdown line when a time is passed", () => {
    cy.mount(ErrorDashboardLogging, {
      props: {
        autoback: 10,
      },
    })

    cy.dataCy("countdown").should("contain.text", " 10 ")
  })

  it("routes to previous page when countdown elapses", () => {
    cy.clock()

    const router = createRouter({ routes: [], history: createMemoryHistory() })
    cy.stub(router, "back").as("router-back-stub")

    cy.mount(ErrorDashboardLogging, {
      props: {
        autoback: 1,
      },
      router,
    })

    cy.dataCy("countdown").should("contain.text", " 1 ")
    cy.get("@router-back-stub").should("not.have.been.called")

    cy.tick(1100)
    cy.dataCy("countdown").should("not.contain.text", " 1 ")
    cy.get("@router-back-stub").should("have.been.calledOnce")
  })
})
