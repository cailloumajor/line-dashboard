const centrifugoHost = Cypress.env("CENTRIFUGO_HOST")
const url = "/line-dashboard/e2e-tests"

const centrifugoPublish = (data: Record<string, unknown>) => {
  cy.request({
    method: "POST",
    url: `http://${centrifugoHost}:8000/api`,
    headers: {
      Authorization: "apikey dc1e276a-9eb5-4950-a8bc-c13fe848154a",
    },
    body: {
      method: "publish",
      params: {
        channel: "opcua.data:e2e-tests",
        data,
      },
    },
  })
}

describe("Line dashboard", () => {
  beforeEach(() => {
    cy.visit(url)
    cy.get("main.q-page").should("be.visible")
    cy.get(".q-loading").should("not.exist")
    cy.dataCy("status-0").should("contain.text", "swap_horiz")
  })

  it("gets header title from config API", () => {
    cy.dataCy("layout-title").should("have.text", "End-to-end tests")
  })

  context("with clock mocked", () => {
    before(() => {
      cy.clock()
    })

    after(() => {
      cy.clock().invoke("restore")
    })

    it("shows skeletons if links are not all good", () => {
      cy.tick(20000)
      cy.dataCy("metric-value-text").should("not.exist")
      cy.get(".q-skeleton").should("have.length", 6)
    })
  })

  it("shows all green status", () => {
    centrifugoPublish({})

    cy.dataCy("status-0").should("contain.text", "swap_horiz")
    cy.dataCy("status-1").should("contain.text", "swap_horiz")
  })

  it("shows published values", () => {
    centrifugoPublish({
      goodParts: 5641,
      scrapParts: 849,
      averageCycleTime: 987,
    })

    cy.dataCy("metric-0").dataCy("metric-value-text").should("have.text", 5641)
    cy.dataCy("metric-1")
      .dataCy("metric-value-text")
      .should("have.text", "98.7")
    cy.dataCy("metric-3").dataCy("metric-value-text").should("have.text", 849)
    cy.dataCy("metric-4")
      .dataCy("metric-value-text")
      .invoke("text")
      .should("satisfy", (val) => isFinite(parseFloat(val)))
  })

  it("shows status", () => {
    centrifugoPublish({})

    cy.dataCy("status-text").should("contain", "Stopped")

    centrifugoPublish({
      cycle: true,
    })

    cy.dataCy("status-text").should("contain", "Running")
  })

  it("shows striped background if not running", () => {
    centrifugoPublish({})

    cy.get(".q-page")
      .invoke("css", "background")
      .should("contain", "repeating-linear-gradient")

    centrifugoPublish({
      cycle: true,
    })

    cy.get(".q-page")
      .invoke("css", "background")
      .should("not.contain", "repeating-linear-gradient")
  })
})
