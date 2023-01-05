import FluxQueryWrapper from "app/test/cypress/wrappers/FluxQueryWrapper.vue"

const expectedText =
  'import "sampledata"\n\n' +
  'params={first:"somevalue",second:42}\n\n' +
  "sampledata.string()\n\n" +
  "{}\n"

describe("Flux query composable", () => {
  beforeEach(() => {
    cy.mount(FluxQueryWrapper)
  })

  it("returns the query with replaced params (single line params)", () => {
    cy.fixture("single-line-params.flux").then((rawQuery) => {
      cy.get("#raw-query-input").type(rawQuery, {
        parseSpecialCharSequences: false,
      })
    })

    cy.dataCy("action-button").click()

    cy.get("#query-output").should("have.text", expectedText)
  })

  it("returns the query with replaced params (multiline params)", () => {
    cy.fixture("multiline-params.flux").then((rawQuery) => {
      cy.get("#raw-query-input").type(rawQuery, {
        parseSpecialCharSequences: false,
      })
    })

    cy.dataCy("action-button").click()

    cy.get("#query-output").should("have.text", expectedText)
  })
})
