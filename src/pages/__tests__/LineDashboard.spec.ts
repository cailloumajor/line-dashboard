import { mount } from "@cypress/vue"

import DashboardMetric from "app/test/cypress/wrappers/DashboardMetricStub.vue"
import LineDashboardWrapper from "app/test/cypress/wrappers/LineDashboardWrapper.vue"
import { makeServer } from "src/dev-api-server"
import { LinkStatus, lineDashboardConfigApi } from "src/global"
import { lineDashboardConfigSchema } from "src/schemas"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"
import { useLineDashboardStore } from "src/stores/line-dashboard"

import type { Server } from "miragejs"

const mountComponent = ({ id = "_" } = {}) => {
  mount(LineDashboardWrapper, {
    props: {
      id,
    },
    global: {
      stubs: {
        DashboardMetric,
        QPage: {
          template: "<main><slot /></main>",
        },
      },
    },
  })
  cy.dataCy("async-ready").should("be.visible")
}

describe("LineDashboard", () => {
  beforeEach(() => {
    const server = makeServer()
    cy.wrap(server).as("api-server")
  })

  afterEach(() => {
    cy.get("@api-server").invoke("shutdown")
  })

  it("passes value and color from store to metrics", () => {
    mountComponent()

    cy.wrap(useLineDashboardStore()).as("store")

    const checkValueAndColor = (
      selector: string,
      expVal: string,
      expColor: string
    ) => {
      cy.dataCy(selector).as("target")
      cy.get("@target").dataCy("value").should("have.text", expVal)
      cy.get("@target").dataCy("color").should("have.text", expColor)
    }

    checkValueAndColor("metric-0", "0", "")
    checkValueAndColor("metric-1", "0", "negative")
    checkValueAndColor("metric-2", "0", "")
    checkValueAndColor("metric-3", "0", "positive")
    checkValueAndColor("metric-4", "0", "")

    cy.get("@store").invoke("$patch", {
      cycleTime: 90,
      targetCycleTime: 100,
    })
    checkValueAndColor("metric-1", "90", "positive")
    checkValueAndColor("metric-2", "100", "")

    cy.get("@store").invoke("$patch", {
      goodParts: 1,
      scrapParts: 1,
      cycleTime: 105,
    })
    checkValueAndColor("metric-0", "1", "")
    checkValueAndColor("metric-1", "105", "warning")
    checkValueAndColor("metric-3", "1", "negative")
    checkValueAndColor("metric-4", "0", "")

    cy.get("@store").invoke("$patch", {
      cycleTime: 110,
    })
    checkValueAndColor("metric-1", "110", "negative")
  })

  it("passes window height to metrics components", () => {
    mountComponent()

    cy.dataCy("page-height")
      .as("page-height")
      .should("contain", Cypress.config("viewportHeight"))

    cy.viewport(Cypress.config("viewportWidth"), 543)

    cy.get("@page-height").should("contain", 543)
  })

  it("passes data valid status to metrics components", () => {
    mountComponent()

    cy.dataCy("data-valid").as("data-valid").should("not.be.visible")

    cy.wrap(useLineDashboardStore()).invoke("$patch", {
      centrifugoLinkStatus: LinkStatus.Up,
      opcUaLinkStatus: LinkStatus.Up,
    })

    cy.get("@data-valid").should("be.visible")
  })

  it("requests the config API according to id prop", () => {
    mountComponent({ id: "testid" })

    cy.get<Server>("@api-server")
      .its("pretender.handledRequests")
      .should((reqs) => {
        expect(reqs).to.have.length(1)
        expect(reqs[0]).to.include({ url: `${lineDashboardConfigApi}/testid` })
      })
  })

  it("validates config data against schema", () => {
    const data = { sentinel: "value" }

    cy.stub(lineDashboardConfigSchema, "parseAsync").returns({ title: "" })

    cy.get("@api-server").invoke(
      "get",
      `${lineDashboardConfigApi}/sentinel-id`,
      () => data
    )

    mountComponent({ id: "sentinel-id" })

    cy.wrap(lineDashboardConfigSchema.parseAsync).should(
      "have.been.calledWith",
      data
    )
  })

  it("sets the title in the common line interface store", () => {
    mountComponent()

    cy.wrap(useCommonLineInterfaceConfigStore())
      .its("title")
      .should("equal", "Test Title")
  })
})
