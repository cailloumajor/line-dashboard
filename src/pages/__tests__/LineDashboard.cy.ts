import { ref, watch } from "vue"

import DashboardMetric from "app/test/cypress/wrappers/DashboardMetricStub.vue"
import LineDashboardWrapper from "app/test/cypress/wrappers/LineDashboardWrapper.vue"
import machineDataComposable from "src/composables/machine-data"
import { makeServer } from "src/dev-api-server"
import { LinkStatus, shiftDurationMillis, staticConfigApi } from "src/global"
import { lineDashboardConfigSchema } from "src/schemas"
import { useCampaignDataStore } from "src/stores/campaign-data"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"
import { useMachineDataLinkStatusStore } from "src/stores/machine-data"

import type { MachineData } from "../LineDashboard.vue"
import type { Server } from "miragejs"
import type { Ref } from "vue"

const checkFontSize = (selector: string, expSize: number, delta: number) => {
  cy.get(selector).should(($el) => {
    expect(parseFloat($el.css("font-size"))).to.be.closeTo(expSize, delta)
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
    cy.stub(lineDashboardConfigSchema, "parseAsync")
      .as("schema-parse-stub")
      .resolves({ title: "Stubbed Title" })
    const machineDataLinkBoot = cy.stub()
    cy.wrap(machineDataLinkBoot).as("machine-data-link-boot-stub")
    cy.stub(machineDataComposable, "useMachineDataLinkBoot").returns({
      machineDataLinkBoot,
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

    cy.get<sinon.SinonStub>("@schema-parse-stub").invoke("resolves", {
      title: "",
    })

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
    mountComponent()

    cy.wrap(useCommonLineInterfaceConfigStore())
      .its("title")
      .should("equal", "Stubbed Title")
  })

  it("calls machine data link bootstrap function", () => {
    cy.get<sinon.SinonStub>("@schema-parse-stub").invoke("resolves", {
      title: "",
    })

    mountComponent({ id: "anid" })

    cy.get("@machine-data-link-boot-stub").should(
      "have.been.calledOnceWith",
      {
        goodParts: 0,
        scrapParts: 0,
        averageCycleTime: 0,
        campChange: false,
        cycle: false,
        cycleTimeOver: false,
        fault: false,
      },
      "anid"
    )
  })

  it("passes formatted number to fractional number aware metrics", () => {
    cy.get("@machine-data-link-boot-stub").invoke(
      "callsFake",
      (machineData: MachineData) => {
        machineData.averageCycleTime = 1055
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
      const proxy = ref({})
      cy.wrap(proxy).as("proxy")

      cy.get("@machine-data-link-boot-stub").invoke(
        "callsFake",
        (machineData: MachineData) => {
          watch(proxy, (data) => {
            Object.assign(machineData, data)
          })
        }
      )

      mountComponent()
    })

    it("calculates the effectiveness", () => {
      cy.clock(new Date(1970, 0, 1, 5, 30).getTime())
      cy.dataCy("metric-4").dataCy("value").should("have.text", "0.0")

      cy.tick(shiftDurationMillis / 2)
      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          goodParts: 1400,
        }
      })
      cy.dataCy("metric-4").dataCy("value").should("have.text", "80.0")

      cy.tick(shiftDurationMillis / 2 - 1) // The millisecond just before next shift
      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          goodParts: 3325,
        }
      })
      cy.dataCy("metric-4").dataCy("value").should("have.text", "95.0")

      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          goodParts: 3693,
        }
      })
      cy.dataCy("metric-4").dataCy("value").should("have.text", "105.5")
    })

    it("gives contextual colors to metrics", () => {
      cy.wrap(useCampaignDataStore()).invoke("$patch", {
        targetCycleTime: 100,
      })

      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          averageCycleTime: 1051,
          scrapParts: 1,
        }
      })
      cy.dataCy("metric-1").dataCy("color").should("have.text", "warning")
      cy.dataCy("metric-3").dataCy("color").should("have.text", "negative")

      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          averageCycleTime: 1101,
        }
      })
      cy.dataCy("metric-1").dataCy("color").should("have.text", "negative")

      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          averageCycleTime: 1000,
          scrapParts: 0,
        }
      })
      cy.dataCy("metric-1").dataCy("color").should("have.text", "negative")
      cy.dataCy("metric-3").dataCy("color").should("have.text", "positive")
    })

    it("gives contextual colors to status", () => {
      cy.wrap(useMachineDataLinkStatusStore()).invoke("$patch", {
        centrifugoLinkStatus: LinkStatus.Up,
        plcLinkStatus: LinkStatus.Up,
      })

      cy.wrap(useCampaignDataStore()).invoke("$patch", {
        targetCycleTime: 100,
      })

      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          campChange: true,
        }
      })
      cy.dataCy("status-text").should("have.class", "text-info")

      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          averageCycleTime: 1051,
          campChange: false,
          cycle: true,
        }
      })
      cy.dataCy("status-text").should("have.class", "text-warning")

      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          averageCycleTime: 1000,
        }
      })
      cy.dataCy("status-text").should("have.class", "text-positive")

      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          cycleTimeOver: true,
        }
      })
      cy.dataCy("status-text").should("have.class", "text-warning")

      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          cycle: false,
        }
      })
      cy.dataCy("status-text").should("have.class", "text-orange")

      cy.get<Ref<Partial<MachineData>>>("@proxy").then((proxy) => {
        proxy.value = {
          cycle: false,
          fault: true,
        }
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

      cy.wrap(useMachineDataLinkStatusStore()).invoke("$patch", {
        centrifugoLinkStatus: LinkStatus.Up,
        plcLinkStatus: LinkStatus.Up,
      })

      cy.dataCy("status-card").find(".q-skeleton").should("not.exist")
      cy.dataCy("status-text").should("not.be.empty")
    })
  })
})
