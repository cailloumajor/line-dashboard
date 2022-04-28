import { mount } from "@cypress/vue"

import { useLineDashboardStore } from "src/stores/line-dashboard"

import DashboardStatuses from "../DashboardStatuses.vue"

const checkIcons = (expStatuses: number[]) => {
  for (const [index, expStatus] of expStatuses.entries()) {
    const expClass = ["text-warning", "text-negative", "text-positive"][
      expStatus
    ]
    const expText = ["question_mark", "link_off", "swap_horiz"][expStatus]
    cy.dataCy(`status-${index}`)
      .find(".q-icon")
      .should("have.class", expClass)
      .and("have.text", expText)
  }
}

const cases = [
  [0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0],
  [0, 0, 2, 0, 0, 0],
  [0, 1, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0],
  [0, 1, 2, 0, 0, 0],
  [0, 2, 0, 0, 0, 0],
  [0, 2, 1, 0, 0, 0],
  [0, 2, 2, 0, 0, 0],
  [1, 0, 0, 1, 0, 0],
  [1, 0, 1, 1, 0, 0],
  [1, 0, 2, 1, 0, 0],
  [1, 1, 0, 1, 0, 0],
  [1, 1, 1, 1, 0, 0],
  [1, 1, 2, 1, 0, 0],
  [1, 2, 0, 1, 0, 0],
  [1, 2, 1, 1, 0, 0],
  [1, 2, 2, 1, 0, 0],
  [2, 0, 0, 2, 0, 0],
  [2, 0, 1, 2, 0, 0],
  [2, 0, 2, 2, 0, 0],
  [2, 1, 0, 2, 1, 0],
  [2, 1, 1, 2, 1, 0],
  [2, 1, 2, 2, 1, 0],
  [2, 2, 0, 2, 2, 0],
  [2, 2, 1, 2, 2, 1],
  [2, 2, 2, 2, 2, 2],
]

describe("DashboardStatuses", () => {
  for (const tc of cases) {
    const [
      centrifugoLinkStatus,
      opcUaProxyLinkStatus,
      opcUaLinkStatus,
      ...expStatuses
    ] = tc

    it("displays statuses according to link states", () => {
      mount(DashboardStatuses)

      cy.wrap(useLineDashboardStore()).as("store")

      cy.get("@store").invoke("$patch", {
        centrifugoLinkStatus,
        opcUaProxyLinkStatus,
        opcUaLinkStatus,
      })

      checkIcons(expStatuses)
    })
  }
})
