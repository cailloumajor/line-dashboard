import { ref, watch } from "vue"

import DashboardMetric from "app/test/cypress/wrappers/DashboardMetricStub.vue"
import LineDashboardWrapper from "app/test/cypress/wrappers/LineDashboardWrapper.vue"
import QPage from "app/test/cypress/wrappers/QPageStub.vue"
import TimelineDisplay from "app/test/cypress/wrappers/TimelineDisplayStub.vue"
import fluxQueryComposable from "composables/flux-query"
import machineDataComposable from "composables/machine-data"
import { makeServer } from "src/dev-api-server"
import { LinkStatus, shiftDurationMillis, staticConfigApi } from "src/global"
import { lineDashboardConfigSchema } from "src/schemas"
import { useCampaignDataStore } from "stores/campaign-data"
import { useCommonLineInterfaceConfigStore } from "stores/common-line-interface-config"
import { useMachineDataLinkStatusStore } from "stores/machine-data-link"

import type { Server } from "miragejs"
import type { MachineData } from "src/global"
import type { Ref } from "vue"

interface PartialMachineData {
  val: Partial<MachineData["val"]>
  ts: Partial<MachineData["ts"]>
}

const checkCssSize = (
  selector: string,
  property: string,
  expSize: number,
  delta: number
) => {
  cy.dataCy(selector).should(($el) => {
    expect($el).to.have.css(property)
    expect(parseFloat($el.css(property))).to.be.closeTo(expSize, delta)
  })
}

const mountComponent = ({ id = "_" } = {}) => {
  cy.mount(LineDashboardWrapper, {
    props: {
      id,
    },
    global: {
      stubs: {
        DashboardMetric,
        TimelineDisplay,
        QPage,
      },
    },
  })
  cy.dataCy("async-ready").should("be.visible")
}

describe("LineDashboard", () => {
  beforeEach(() => {
    const server = makeServer()
    cy.wrap(server).as("api-server")
    cy.stub(lineDashboardConfigSchema, "parseAsync")
      .as("schema-parse-stub")
      .resolves({
        title: "",
        influxdbOrg: "",
        influxdbToken: "",
        influxdbBucket: "",
      })

    const machineDataLinkBoot = cy.stub().as("machine-data-link-boot-stub")
    cy.stub(machineDataComposable, "useMachineDataLinkBoot").returns({
      machineDataLinkBoot,
    })

    const makeFluxQueryStub = cy
      .stub()
      .as("make-flux-query-stub")
      .returns("Some stubbed Flux query")
    cy.stub(fluxQueryComposable, "useFluxQuery").returns({
      makeFluxQuery: makeFluxQueryStub,
    })
  })

  afterEach(() => {
    cy.get("@api-server").invoke("shutdown")
  })

  it("sets font size on metrics and height on timeline", () => {
    mountComponent()

    checkCssSize("metric-title", "font-size", 22.5, 0.1)
    checkCssSize("metric-value", "font-size", 85.3, 0.5)
    checkCssSize("timeline", "height", 154.3, 0.5)

    cy.viewport(Cypress.config("viewportWidth"), 480)

    checkCssSize("metric-title", "font-size", 16.4, 0.1)
    checkCssSize("metric-value", "font-size", 62, 0.5)
    checkCssSize("timeline", "height", 112.3, 0.5)
  })

  it("defines metrics titles", () => {
    mountComponent()

    cy.dataCy("metric-title").children("i.q-icon").should("have.length", 5)
    cy.dataCy("metric-title-text").should(
      "have.css",
      "text-transform",
      "uppercase"
    )
    cy.dataCy("metric-unit").should("have.length", 2)
  })

  it("passes data valid status to metrics components", () => {
    mountComponent()

    cy.dataCy("data-valid").as("data-valid").should("not.be.visible")

    cy.wrap(useMachineDataLinkStatusStore()).invoke("$patch", {
      centrifugoLinkStatus: LinkStatus.Up,
      plcLinkStatus: LinkStatus.Up,
    })

    cy.get("@data-valid").should("be.visible")
  })

  it("requests the config API according to id prop", () => {
    const handled = { count: 0 }
    cy.wrap(handled).as("handled")

    cy.get<Server>("@api-server").invoke(
      "get",
      `${staticConfigApi}/testid/line-dashboard`,
      () => {
        handled.count += 1
      }
    )

    mountComponent({ id: "testid" })

    cy.get("@handled").its("count").should("equal", 1)
  })

  it("validates config data against schema", () => {
    const data = { sentinel: "value" }

    cy.get("@api-server").invoke(
      "get",
      `${staticConfigApi}/sentinel-id/line-dashboard`,
      () => data
    )

    mountComponent({ id: "sentinel-id" })

    cy.wrap(lineDashboardConfigSchema.parseAsync).should(
      "have.been.calledWith",
      data
    )
  })

  it("sets the title in the common line interface store", () => {
    cy.get<sinon.SinonStub>("@schema-parse-stub").invoke("resolves", {
      title: "Stubbed Title",
      influxdbOrg: "",
      influxdbToken: "",
      influxdbBucket: "",
    })

    mountComponent()

    cy.wrap(useCommonLineInterfaceConfigStore())
      .its("title")
      .should("equal", "Stubbed Title")
  })

  it("calls machine data link bootstrap function", () => {
    mountComponent({ id: "anid" })

    cy.get("@machine-data-link-boot-stub").should(
      "have.been.calledOnceWith",
      {
        val: {
          goodParts: 0,
          scrapParts: 0,
          averageCycleTime: 0,
          campChange: false,
          cycle: false,
          fault: false,
        },
        ts: {
          goodParts: "",
          scrapParts: "",
          averageCycleTime: "",
          campChange: "",
          cycle: "",
          fault: "",
        },
      },
      "anid"
    )
  })

  it("passes formatted number to fractional number aware metrics", () => {
    cy.get("@machine-data-link-boot-stub").invoke(
      "callsFake",
      (machineData: MachineData) => {
        machineData.val.averageCycleTime = 1055
      }
    )

    mountComponent()

    cy.wrap(useCampaignDataStore()).invoke("$patch", {
      targetCycleTime: 60,
    })

    cy.dataCy("metric-1").dataCy("value").should("have.text", "105.5")
    cy.dataCy("metric-2").dataCy("value").should("have.text", "60.0")
  })

  context("machine data reactivity", () => {
    beforeEach(() => {
      const proxy: Ref<PartialMachineData> = ref({
        val: {},
        ts: {},
      })
      cy.wrap(proxy).as("proxy")

      cy.get("@machine-data-link-boot-stub").invoke(
        "callsFake",
        (machineData: MachineData) => {
          watch(proxy, (data) => {
            Object.assign(machineData.val, data.val)
            Object.assign(machineData.ts, data.ts)
          })
        }
      )

      mountComponent()
    })

    it("calculates the effectiveness", () => {
      cy.clock(new Date(1970, 0, 1, 5, 30).getTime())
      cy.dataCy("metric-4").dataCy("value").should("have.text", "0.0")

      cy.tick(shiftDurationMillis / 2)
      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {
            goodParts: 1400,
          },
          ts: {},
        }
      })
      cy.dataCy("metric-4").dataCy("value").should("have.text", "80.0")

      cy.tick(shiftDurationMillis / 2 - 1) // The millisecond just before next shift
      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {
            goodParts: 3325,
          },
          ts: {},
        }
      })
      cy.dataCy("metric-4").dataCy("value").should("have.text", "95.0")

      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {
            goodParts: 3693,
          },
          ts: {},
        }
      })
      cy.dataCy("metric-4").dataCy("value").should("have.text", "105.5")
    })

    it("gives contextual colors to metrics", () => {
      cy.wrap(useCampaignDataStore()).invoke("$patch", {
        targetCycleTime: 100,
      })

      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {
            averageCycleTime: 1051,
            scrapParts: 1,
          },
          ts: {},
        }
      })
      cy.dataCy("metric-1").dataCy("color").should("have.text", "warning")
      cy.dataCy("metric-3").dataCy("color").should("have.text", "negative")

      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {
            averageCycleTime: 1101,
          },
          ts: {},
        }
      })
      cy.dataCy("metric-1").dataCy("color").should("have.text", "negative")

      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {
            averageCycleTime: 1000,
            scrapParts: 0,
          },
          ts: {},
        }
      })
      cy.dataCy("metric-1").dataCy("color").should("have.text", "negative")
      cy.dataCy("metric-3").dataCy("color").should("have.text", "positive")
    })

    it("gives contextual colors to status and renders its duration", () => {
      cy.clock()

      cy.wrap(useMachineDataLinkStatusStore()).invoke("$patch", {
        centrifugoLinkStatus: LinkStatus.Up,
        plcLinkStatus: LinkStatus.Up,
      })

      cy.wrap(useCampaignDataStore()).invoke("$patch", {
        targetCycleTime: 100,
      })

      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {
            campChange: true,
          },
          ts: {
            // Past 2 h 25 min
            campChange: new Date(Date.now() - 8_700_000).toISOString(),
          },
        }
      })
      cy.dataCy("status-text").should("have.class", "text-info")
      cy.dataCy("status-duration")
        .should("be.visible")
        .and("contain.text", " 2 ")
        .and("contain.text", " 25 ")

      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {
            campChange: false,
          },
          ts: {
            // Past 1 h 12 min
            cycle: new Date(Date.now() - 4_320_000).toISOString(),
          },
        }
      })
      cy.dataCy("status-text").should("have.class", "text-negative")
      cy.dataCy("status-duration")
        .should("be.visible")
        .and("contain.text", " 1 ")
        .and("contain.text", " 12 ")

      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {
            averageCycleTime: 1051,
            cycle: true,
          },
          ts: {
            goodParts: new Date().toISOString(),
          },
        }
      })
      cy.dataCy("status-text").should("have.class", "text-warning")
      cy.dataCy("status-duration").should("not.exist")

      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {
            averageCycleTime: 1000,
          },
          ts: {},
        }
      })
      cy.dataCy("status-text").should("have.class", "text-positive")
      cy.dataCy("status-duration").should("not.exist")

      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {},
          ts: {
            // Past s min 50 s
            goodParts: new Date(Date.now() - 350_000).toISOString(),
          },
        }
      })
      cy.tick(15)
      cy.dataCy("status-text").should("have.class", "text-negative")
      cy.dataCy("status-duration")
        .should("be.visible")
        .and("contain.text", " 5 ")

      cy.get<Ref<PartialMachineData>>("@proxy").then((proxy) => {
        proxy.value = {
          val: {},
          ts: {
            goodParts: new Date().toISOString(),
          },
        }
      })
      cy.tick(295_000)
      cy.dataCy("status-text").should("have.class", "text-positive")
      cy.dataCy("status-duration").should("not.exist")

      cy.tick(5_001)
      cy.dataCy("status-text").should("have.class", "text-negative")
      cy.dataCy("status-duration")
        .should("be.visible")
        .and("contain.text", " 5 ")
    })
  })

  context("status card", () => {
    it("shows a skeleton while data is not valid", () => {
      mountComponent()

      cy.dataCy("status-card").find(".q-skeleton").should("be.visible")
    })

    it("shows some text when data is valid", () => {
      mountComponent()

      cy.wrap(useMachineDataLinkStatusStore()).invoke("$patch", {
        centrifugoLinkStatus: LinkStatus.Up,
        plcLinkStatus: LinkStatus.Up,
      })

      cy.dataCy("status-card").find(".q-skeleton").should("not.exist")
      cy.dataCy("status-text").should("not.be.empty")
    })
  })

  it("passes props to timeline", () => {
    cy.get<sinon.SinonStub>("@schema-parse-stub").invoke("resolves", {
      influxdbOrg: "someOrg",
      influxdbToken: "someToken",
      influxdbBucket: "someBucket",
    })

    mountComponent({ id: "something" })

    cy.get("@make-flux-query-stub").should(
      "have.been.calledOnceWith",
      Cypress.sinon
        .match("params = {")
        .and(Cypress.sinon.match("from(bucket: params.bucket)")),
      {
        cycleTimeOverColor: Cypress.sinon.match(/^#[0-9a-z]{6}$/i),
        cycleColor: Cypress.sinon.match(/^#[0-9a-z]{6}$/i),
        campChangeColor: Cypress.sinon.match(/^#[0-9a-z]{6}$/i),
        stoppedColor: Cypress.sinon.match(/^#[0-9a-z]{6}$/i),
        bucket: "someBucket",
        id: "something",
      }
    )

    cy.dataCy("influxdb-org").should("have.text", "someOrg")
    cy.dataCy("influxdb-token").should("have.text", "someToken")
    cy.dataCy("flux-query").should("have.text", "Some stubbed Flux query")
    cy.dataCy("timeline-opacity")
      .invoke("text")
      .should((opacity) => {
        expect(parseFloat(opacity)).to.be.within(0, 1)
      })
    cy.dataCy("timeline-legend").should(($el) => {
      expect($el.text()).to.not.be.empty
    })
  })
})
