import { mount } from "@cypress/vue"
import { Subject } from "rxjs"

import DashboardMetric from "app/test/cypress/wrappers/DashboardMetricStub.vue"
import LineDashboardWrapper from "app/test/cypress/wrappers/LineDashboardWrapper.vue"
import fieldDataComposable from "composables/field-data"
import { makeServer } from "src/dev-api-server"
import { LinkStatus, lineDashboardConfigApi } from "src/global"
import { lineDashboardConfigSchema } from "src/schemas"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"
import { useFieldDataLinkStatusStore } from "src/stores/field-data"

import type { Server } from "miragejs"

type FieldData = Record<string, unknown>

const checkFontSize = (selector: string, expSize: number, delta: number) => {
  cy.get(selector).should(($el) => {
    expect(parseFloat($el.css("font-size"))).to.be.closeTo(expSize, delta)
  })
}

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

  it("sets the font size on metrics", () => {
    mountComponent()

    checkFontSize(".metric-title", 19, 1)
    checkFontSize(".metric-value", 72, 2)

    cy.viewport(Cypress.config("viewportWidth"), 543)

    checkFontSize(".metric-title", 15, 1)
    checkFontSize(".metric-value", 57, 2)
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
      .should("have.length", 1)
      .its(0)
      .should("include", { url: `${lineDashboardConfigApi}/testid` })
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

  it("calls field data link bootstrap function", () => {
    cy.stub(lineDashboardConfigSchema, "parseAsync").returns({
      title: "",
      opcUaNodeIds: { test: "nodeID" },
      centrifugoNamespace: "testns",
      opcUaNsURI: "urn:bootstrap-call-test",
    })

    mountComponent()

    cy.get("@field-data-link-boot-stub").should(
      "have.been.calledOnceWith",
      {
        goodParts: 0,
        scrapParts: 0,
        cycleTime: 0,
        inCycle: false,
        fault: false,
      },
      { test: "nodeID" },
      "testns",
      "urn:bootstrap-call-test"
    )
  })

  it("passes formatted number to fractional number aware metrics", () => {
    cy.get("@field-data-link-boot-stub").invoke(
      "callsFake",
      (fieldData: Record<string, unknown>) => {
        fieldData.cycleTime = 105.49
      }
    )

    mountComponent()

    cy.dataCy("metric-1").dataCy("value").should("have.text", "105.5")
    cy.dataCy("metric-2").dataCy("value").should("have.text", "25.0")
    cy.dataCy("metric-4").dataCy("value").should("have.text", "0.0")
  })

  context("field data reactivity", () => {
    beforeEach(() => {
      const subject = new Subject<FieldData>()
      cy.wrap(subject).as("subject")

      cy.get("@field-data-link-boot-stub").invoke(
        "callsFake",
        (fieldData: Record<string, unknown>) => {
          subject.subscribe((data) => {
            Object.assign(fieldData, data)
          })
        }
      )

      mountComponent()
    })

    afterEach(() => {
      cy.get<Subject<FieldData>>("@subject").invoke("complete")
    })

    it("gives contextual colors to metrics", () => {
      cy.get<Subject<FieldData>>("@subject").invoke("next", {
        cycleTime: 26.5,
        scrapParts: 1,
      })
      cy.dataCy("metric-1").dataCy("color").should("have.text", "warning")
      cy.dataCy("metric-3").dataCy("color").should("have.text", "negative")

      cy.get<Subject<FieldData>>("@subject").invoke("next", {
        cycleTime: 30,
      })
      cy.dataCy("metric-1").dataCy("color").should("have.text", "negative")

      cy.get<Subject<FieldData>>("@subject").invoke("next", {
        cycleTime: 25.0,
        scrapParts: 0,
      })
      cy.dataCy("metric-1").dataCy("color").should("have.text", "negative")
      cy.dataCy("metric-3").dataCy("color").should("have.text", "positive")
    })

    it("gives contextual colors to status", () => {
      cy.wrap(useFieldDataLinkStatusStore()).invoke("$patch", {
        centrifugoLinkStatus: LinkStatus.Up,
        opcUaProxyLinkStatus: LinkStatus.Up,
        opcUaLinkStatus: LinkStatus.Up,
      })

      cy.get<Subject<FieldData>>("@subject").invoke("next", {
        cycleTime: 26.5,
        inCycle: true,
      })
      cy.dataCy("status-text").should("have.class", "text-warning")

      cy.get<Subject<FieldData>>("@subject").invoke("next", {
        cycleTime: 25,
      })
      cy.dataCy("status-text").should("have.class", "text-positive")

      cy.get<Subject<FieldData>>("@subject").invoke("next", {
        inCycle: false,
      })
      cy.dataCy("status-text").should("have.class", "text-orange")

      cy.get<Subject<FieldData>>("@subject").invoke("next", {
        inCycle: false,
        fault: true,
      })
      cy.dataCy("status-text").should("have.class", "text-negative")
    })
  })

  context("status card", () => {
    it("shows a skeleton while data is not valid", () => {
      mountComponent()

      cy.dataCy("status-card").find(".q-skeleton").should("be.visible")
    })

    it("shows some text when data is valid", () => {
      mountComponent()

      cy.wrap(useFieldDataLinkStatusStore()).invoke("$patch", {
        centrifugoLinkStatus: LinkStatus.Up,
        opcUaProxyLinkStatus: LinkStatus.Up,
        opcUaLinkStatus: LinkStatus.Up,
      })

      cy.dataCy("status-card").find(".q-skeleton").should("not.exist")
      cy.dataCy("status-text").should("not.be.empty")
    })
  })
})
