import TimelineDisplayWrapper from "app/test/cypress/wrappers/TimelineDisplayWrapper.vue"
import { timelineRefreshMillis } from "src/global"

import useWasmUtils from "../frontend-utils-wasm"

import type { SinonStub } from "cypress/types/sinon"

class MockedTimeline {
  async draw() {
    return null
  }
}

const mountComponent = () => {
  cy.mount(TimelineDisplayWrapper, { props: { height: "200px" } }).then(
    ({ wrapper }) => {
      cy.wrap(wrapper).as("vue-wrapper")
    },
  )
  cy.dataCy("async-ready").should("be.visible")
}

describe("TimelineDisplay", () => {
  beforeEach(() => {
    cy.intercept("/timeline-compute-api", new Uint8Array())
    cy.stub(useWasmUtils, "init").as("wasm-init-stub").resolves()
    const mockedTimeline = new MockedTimeline()
    cy.stub(mockedTimeline, "draw").as("draw-stub").resolves()
    cy.stub(useWasmUtils, "Timeline")
      .as("timeline-stub")
      .returns(mockedTimeline)
  })

  it("shows error raised by draw method", () => {
    cy.get<SinonStub>("@draw-stub").invoke("rejects", new Error("test error"))

    mountComponent()

    cy.dataCy("timeline-canvas").should("not.be.visible")
    cy.dataCy("timeline-error")
      .should("contain.text", "test error")
      .and(($el) => {
        expect($el).to.have.css("font-size")
        expect(parseFloat($el.css("font-size"))).to.be.closeTo(24, 0.1)
      })
  })

  it("reacts to parent resize", () => {
    const checkCanvasSize = (height: number, width: number) => {
      cy.dataCy("timeline-canvas")
        .should("have.prop", "width", width)
        .and("have.prop", "height", height)
    }

    mountComponent()

    checkCanvasSize(160, 1000)
    cy.get("@draw-stub").should("have.been.calledOnce")

    cy.get("@vue-wrapper").invoke("setProps", { height: "300px" })

    checkCanvasSize(240, 1000)
    cy.get("@draw-stub").should("have.been.calledTwice")
  })

  it("intializes WASM", () => {
    mountComponent()

    cy.get("@wasm-init-stub").should(
      "have.been.calledOnceWith",
      useWasmUtils.wasmUrl,
    )
  })

  it("passes configuration to timeline object", () => {
    mountComponent()

    cy.get("@timeline-stub").should(
      "have.been.calledOnceWithExactly",
      Cypress.sinon.match.instanceOf(HTMLCanvasElement),
      {
        palette: ["color1", "color2", "color3"],
        fontFamily: Cypress.sinon.match("Roboto"),
        opacity: 0.9,
        xIntervalMinutes: 61,
        xOffsetMinutes: 45,
        emphasisLabels: ["some", "other"],
      },
    )
  })

  it("requests compute API and passes data to draw method", () => {
    const body = new Uint8Array([0x01, 0x02, 0x03, 0x04])
    cy.intercept("/timeline-compute-api", { body: body.buffer })

    mountComponent()

    cy.get<SinonStub>("@draw-stub").should("have.been.calledWith", body)
  })

  it("calls draw method periodically", () => {
    cy.clock()

    mountComponent()

    cy.tick(timelineRefreshMillis * 3.1)

    cy.get<SinonStub>("@draw-stub").its("callCount").should("be.at.least", 3)
  })

  it("renders legend", () => {
    mountComponent()

    cy.dataCy("legend")
      .should("contain", "first item")
      .and("contain", "second item")
      .and(($el) => {
        expect($el).to.have.css("font-size")
        expect(parseFloat($el.css("font-size"))).to.be.closeTo(20, 0.1)
      })
    cy.dataCy("legend-box").should(($legendBox) => {
      expect($legendBox.length).to.equal(2)
      expect($legendBox).to.have.css("opacity", "0.9")
      expect($legendBox.height()).to.be.closeTo(20, 0.1)
      expect($legendBox.width()).to.be.closeTo(20, 0.1)
    })
  })
})
