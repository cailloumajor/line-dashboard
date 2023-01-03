const centrifugoHost = Cypress.env("CENTRIFUGO_HOST")
const influxdbHost = Cypress.env("INFLUXDB_HOST")

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
        return `opcua.data,id=e2e-tests campChange=false,cycle=false,cycleTimeOver=false ${ts}`
      })
      .join("\n")
    cy.request({
      ...commonOptions,
      method: "POST",
      url: `http://${influxdbHost}:8086/api/v2/write`,
      body,
    })
  })

  beforeEach(() => {
    cy.intercept("/influxdb/api/v2/query*").as("influxQuery")
    cy.visit("/line-dashboard/e2e-tests")
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

  it("displays the timeline", () => {
    cy.wait("@influxQuery")
      .its("response.body")
      .should((body: string) => {
        const lines = body.split(/\r\n/)
        expect(lines).to.have.length.that.is.above(1440)
      })

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

  it("does not overflow", () => {
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
