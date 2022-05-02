import { mount } from "@cypress/vue"

import DashboardMetric from "app/test/cypress/wrappers/DashboardMetricStub.vue"
import LineDashboardWrapper from "app/test/cypress/wrappers/LineDashboardWrapper.vue"
import fieldDataComposable from "composables/field-data"
import { makeServer } from "src/dev-api-server"
import { LinkStatus, lineDashboardConfigApi } from "src/global"
import { lineDashboardConfigSchema } from "src/schemas"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"
import { useFieldDataLinkStatusStore } from "src/stores/field-data"

import type { FieldData } from "composables/field-data"
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
    const fieldDataLinkBoot = cy.stub()
    cy.wrap(fieldDataLinkBoot).as("field-data-link-boot-stub")
    cy.stub(fieldDataComposable, "useFieldDataLinkBoot").returns({
      fieldDataLinkBoot,
    })
  })

  afterEach(() => {
    cy.get("@api-server").invoke("shutdown")
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

    cy.wrap(useFieldDataLinkStatusStore()).invoke("$patch", {
      centrifugoLinkStatus: LinkStatus.Up,
      opcUaProxyLinkStatus: LinkStatus.Up,
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

  it("passes reactive field data to field data bootstrap", () => {
    cy.get("@field-data-link-boot-stub").invoke(
      "callsFake",
      (fieldData: FieldData) => {
        fieldData.value.goodParts = 1564
        fieldData.value.scrapParts = 846
        fieldData.value.cycleTime = 105
      }
    )

    mountComponent()

    cy.dataCy("metric-0").dataCy("value").should("have.text", 1564)
    cy.dataCy("metric-1").dataCy("value").should("have.text", 105)
    cy.dataCy("metric-3").dataCy("value").should("have.text", 846)
  })
})
