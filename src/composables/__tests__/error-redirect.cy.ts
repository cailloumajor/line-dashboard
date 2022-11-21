import { SessionStorage } from "quasar"

import ErrorRedirectWrapper from "app/test/cypress/wrappers/ErrorRedirectWrapper.vue"
import { loadingErrorStorageKey } from "src/global"

describe("error redirect composable", () => {
  beforeEach(() => cy.mount(ErrorRedirectWrapper))

  it("writes errors to session storage", () => {
    cy.wrap(SessionStorage)
      .as("storage")
      .invoke("remove", loadingErrorStorageKey)

    cy.dataCy("errors-input").type("first error\nsecond error\nthird error")
    cy.dataCy("action-button").click()

    cy.get("@storage")
      .invoke("getItem", loadingErrorStorageKey)
      .should("have.length", 3)
      .and((errors) => {
        expect(errors[0]).to.contain("first error")
        expect(errors[1]).to.contain("second error")
        expect(errors[2]).to.contain("third error")
      })
  })

  it("redirects to the error page", () => {
    cy.get("@router-mock").its("push").as("push").should("not.have.been.called")

    cy.dataCy("action-button").click()

    cy.get("@push").should(
      "have.been.calledOnceWith",
      Cypress.sinon.match({
        name: "loadingError",
        query: {
          autoback: Cypress.sinon.match.number,
        },
      })
    )
  })
})
