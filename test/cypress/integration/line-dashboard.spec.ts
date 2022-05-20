interface PublicationParams {
  channel: string
  data: Record<string, unknown>
}

const centrifugoHost = Cypress.env("CI") ? "localhost" : "centrifugo"
const url = "/line-dashboard/e2e-tests"

const hearbeat = (status: number) => ({
  channel: "e2e-tests:heartbeat",
  data: { status },
})

const centrifugoPublish = (params: PublicationParams) => {
  cy.request({
    method: "POST",
    url: `http://${centrifugoHost}:8000/api`,
    headers: {
      Authorization: "apikey dc1e276a-9eb5-4950-a8bc-c13fe848154a",
    },
    body: {
      method: "publish",
      params,
    },
  })
}

before(() => {
  cy.on("uncaught:exception", () => false)
  cy.visit(url)
  cy.reload(true)
  cy.get("main.q-page", { timeout: 10000 }).should("be.visible")
})

describe("Line dashboard", () => {
  beforeEach(() => {
    cy.visit(url)
    cy.get("main.q-page").should("be.visible")
    cy.get(".q-loading").should("not.exist")
    cy.dataCy("status-0").should("contain.text", "swap_horiz")
  })

  it("gets header title from config API", () => {
    cy.dataCy("layout-title").should("have.text", "Test Title")
  })

  it("shows skeletons if links are not all good", () => {
    centrifugoPublish(hearbeat(1))

    cy.dataCy("metric-value-text").should("not.exist")
    cy.get(".q-skeleton").should("have.length", 6)
  })

  it("shows all green status", () => {
    centrifugoPublish(hearbeat(0))

    cy.dataCy("status-0").should("contain.text", "swap_horiz")
    cy.dataCy("status-1").should("contain.text", "swap_horiz")
    cy.dataCy("status-2").should("contain.text", "swap_horiz")
  })

  it("shows published values", () => {
    centrifugoPublish(hearbeat(0))
    centrifugoPublish({
      channel: "e2e-tests:dashboard@1000",
      data: {
        0: 5641,
        1: 849,
        2: 987,
      },
    })

    cy.dataCy("metric-0").dataCy("metric-value-text").should("have.text", 5641)
    cy.dataCy("metric-1")
      .dataCy("metric-value-text")
      .should("have.text", "987.0")
    cy.dataCy("metric-3").dataCy("metric-value-text").should("have.text", 849)
    cy.dataCy("metric-4")
      .dataCy("metric-value-text")
      .invoke("text")
      .should("match", /^\d+\.\d$/)
  })

  it("shows status", () => {
    centrifugoPublish(hearbeat(0))

    cy.dataCy("status-text").should("contain", "Stopped")

    centrifugoPublish({
      channel: "e2e-tests:dashboard@1000",
      data: {
        3: true,
      },
    })

    cy.dataCy("status-text").should("contain", "Running")
  })
})
