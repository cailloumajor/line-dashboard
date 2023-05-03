export {}

const visit = () => {
  cy.visit("/")
  cy.get(".q-page-container").should("be.visible")
}

describe("Landing page", () => {
  it("provides compressed assets", () => {
    Cypress.automation("remote:debugger:protocol", {
      command: "Network.clearBrowserCache",
    })

    cy.intercept("GET", "index.*.js").as("getIndexJs")
    cy.intercept("GET", "index.*.css").as("getIndexCss")

    visit()

    cy.wait(["@getIndexJs", "@getIndexCss"]).should((interceptions) => {
      for (const interception of interceptions) {
        expect(interception.response?.headers).to.have.property(
          "content-encoding",
          "gzip"
        )
      }
    })
  })
})
