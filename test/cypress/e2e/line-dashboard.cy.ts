import { timelineRefreshMillis } from "../../../src/global"

interface MachineData {
  val?: object
  ts?: Record<string, string>
}

const centrifugoHost = Cypress.env("CENTRIFUGO_HOST")
const influxdbHost = Cypress.env("INFLUXDB_HOST")

const centrifugoPublish = (data: MachineData) => {
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

const visit = () => {
  cy.visit("/line-dashboard/e2e-tests")
  cy.get("main.q-page").should("be.visible")
  cy.get(".q-loading").should("not.exist")
  cy.dataCy("centrifugo-status").should("contain.text", "swap_horiz")
}

describe("Line dashboard", () => {
  before(() => {
    const commonOptions = {
      qs: {
        org: "e2e-tests-org",
        bucket: "e2e-tests-bucket",
        precision: "ms",
      },
      headers: {
        Authorization: "Token e2e-tests-token",
      },
    }
    const startDate = new Date(Date.now() - 24 * 3600 * 1000)
    const endDate = new Date()
    cy.request({
      ...commonOptions,
      method: "POST",
      url: `http://${influxdbHost}:8086/api/v2/delete`,
      body: {
        start: startDate.toISOString(),
        stop: endDate.toISOString(),
      },
    })
    const body = [3, 2, 1, 0]
      .map((minutes) => {
        const ts = Date.now() - minutes * 60 * 1000
        return `opcua.data,id=e2e-tests campChange=false,cycle=false ${ts}`
      })
      .join("\n")
    cy.request({
      ...commonOptions,
      method: "POST",
      url: `http://${influxdbHost}:8086/api/v2/write`,
      body,
    })
  })

  it("has dynamic header title", () => {
    visit()

    centrifugoPublish({
      val: {
        partRef: "E2E-CAMPAIGN",
      },
    })
    cy.dataCy("layout-title").should(
      "have.text",
      "End-to-end tests\xa0—\xa0E2E-CAMPAIGN"
    )
  })

  it("shows skeletons if links are not all good", () => {
    cy.clock()

    visit()

    cy.tick(20000)
    cy.dataCy("metric-value-text").should("not.exist")
    cy.get(".q-skeleton").should("have.length", 6)
  })

  it("connects to Centrifugo via WebSocket when origin is allowed", () => {
    visit()

    cy.dataCy("centrifugo-transport").should("contain.text", "WS")
  })

  it("connects to Centrifugo via SSE when origin is not allowed", () => {
    cy.request("PUT", "/change-origin", "http://example.com")
      .its("status")
      .should("equal", 200)

    visit()

    cy.dataCy("centrifugo-transport")
      .should("contain.text", "SSE")
      .and("have.class", "text-warning")
  })

  it("shows all green status", () => {
    visit()

    centrifugoPublish({})

    cy.dataCy("centrifugo-status").should("contain.text", "swap_horiz")
    cy.dataCy("centrifugo-transport")
      .should("have.text", "(WS)")
      .and("have.class", "text-positive")
    cy.dataCy("plc-status").should("contain.text", "swap_horiz")
  })

  it("shows published values", () => {
    visit()

    centrifugoPublish({
      val: {
        goodParts: 5641,
        scrapParts: 849,
        averageCycleTime: 987,
      },
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
    visit()

    centrifugoPublish({})

    cy.dataCy("status-text").should("contain", "Stopped")

    centrifugoPublish({
      val: {
        cycle: true,
      },
      ts: {
        goodParts: new Date().toISOString(),
      },
    })

    cy.dataCy("status-text").should("contain", "Running")
  })

  it("displays the timeline, recovering after an error", () => {
    cy.clock()

    visit()

    cy.intercept("/influxdb/api/v2/query*", { times: 1 }, { statusCode: 500 })
    cy.tick(timelineRefreshMillis * 1.1)
    cy.dataCy("timeline-error").should("be.visible")
    cy.dataCy("timeline-canvas").should("not.be.visible")

    cy.intercept("/influxdb/api/v2/query*").as("influxQuery")
    cy.tick(timelineRefreshMillis * 1.1)
    cy.wait("@influxQuery")
      .its("response.body")
      .should((body: string) => {
        const lines = body.split(/\r\n/)
        expect(lines).to.have.length.that.is.within(720, 730)
      })
    cy.dataCy("timeline-error").should("not.be.visible")
    cy.dataCy<HTMLCanvasElement>("timeline-canvas").should(($canvas) => {
      expect($canvas).to.have.lengthOf(1)
      const canvasElem = $canvas[0]
      const context = canvasElem.getContext("2d")
      const { height, width } = canvasElem
      const imageData = context?.getImageData(0, 0, width, height)
      const pixels = new Uint32Array((imageData as ImageData).data.buffer)
      expect(pixels.some((pixel) => pixel !== 0)).to.be.true
    })
  })

  it("shows striped background if not running", () => {
    visit()

    centrifugoPublish({})

    cy.get(".q-page")
      .invoke("css", "background")
      .should("contain", "repeating-linear-gradient")

    centrifugoPublish({
      val: {
        cycle: true,
      },
      ts: {
        goodParts: new Date().toISOString(),
      },
    })

    cy.get(".q-page")
      .invoke("css", "background")
      .should("not.contain", "repeating-linear-gradient")
  })

  it("does not overflow", () => {
    visit()

    const check = (viewportHeight: number) => {
      cy.get("html").should(($html) => {
        expect($html.height()).to.equal(viewportHeight)
        const { clientHeight, scrollHeight } = $html[0]
        expect(scrollHeight).to.not.be.above(clientHeight)
      })
    }

    for (const height of [800, 650]) {
      cy.viewport(height * 1.777, height)
      check(height)
    }
  })
})
