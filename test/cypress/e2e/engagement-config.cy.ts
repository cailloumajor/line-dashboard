describe("Engagement configuration", () => {
  beforeEach(() => {
    cy.visit("/config/engagement/e2e-tests")
  })

  it("has correct title", () => {
    cy.dataCy("layout-title").should(
      "have.text",
      "Digital Factory\xa0—\xa0Lines Engagement",
    )
  })

  it("sends the data with save button", () => {
    cy.request("DELETE", "/partner-config-patches")
    cy.dataCy("checkbox").click({ multiple: true })
    cy.dataCy("cycle-time-input").eq(0).type("{selectAll}10.1")
    cy.dataCy("cycle-time-input").eq(1).type("{selectAll}20.2")
    cy.dataCy("efficiency-input").eq(0).type("{selectAll}30.3")
    cy.dataCy("efficiency-input").eq(1).type("{selectAll}40.4")
    cy.dataCy("save-button").click()

    const falseArray = new Array(21).fill(false)
    cy.request("/partner-config-patches")
      .its("body")
      .should("deep.equal", [
        [
          "one",
          {
            shiftEngaged: falseArray,
            targetCycleTime: 10.1,
            targetEfficiency: 0.303,
          },
        ],
        [
          "two",
          {
            shiftEngaged: falseArray,
            targetCycleTime: 20.2,
            targetEfficiency: 0.404,
          },
        ],
      ])
  })
})
