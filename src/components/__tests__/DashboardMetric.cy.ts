import { ColorTranslator } from "colortranslator"
import { colors } from "quasar"
import { h } from "vue"

import DashboardMetricWrapper from "app/test/cypress/wrappers/DashboardMetricWrapper.vue"

import DashboardMetric from "../DashboardMetric.vue"

const { getPaletteColor } = colors

describe("DashboardMetric", () => {
  it("shows fallback title if slot is not provided", () => {
    cy.mount(DashboardMetric, {
      props: {
        value: 42,
        dataValid: true,
      },
    })

    cy.dataCy("metric-title-section").should("have.text", "???")
  })

  it("renders the title from default slot", () => {
    cy.mount(DashboardMetric, {
      props: {
        value: 42,
        dataValid: true,
      },
      slots: {
        default: h("code", {}, "Title slot"),
      },
    })

    cy.dataCy("metric-title-section").should(
      "have.html",
      "<code>Title slot</code>",
    )
  })

  it("displays numeric value according to props", () => {
    cy.mount(DashboardMetric, {
      props: {
        value: 5616,
        dataValid: true,
      },
    })

    cy.dataCy("metric-value-text").should("have.text", "5616")
  })

  it("displays text value according to props", () => {
    cy.mount(DashboardMetric, {
      props: {
        value: "37.0",
        dataValid: true,
      },
    })

    cy.dataCy("metric-value-text").should("have.text", "37.0")
  })

  it("renders the value with color according to prop", () => {
    const testColor = "negative"
    const exp = new ColorTranslator(getPaletteColor(testColor))
    const elColor = ($el: JQuery<HTMLElement>) =>
      new ColorTranslator($el.css("color"))

    cy.mount(DashboardMetricWrapper)

    cy.dataCy("metric-value-text").should(($el) => {
      expect($el).to.have.css("color")
      expect(elColor($el).HEXA).to.not.equal(exp.HEXA)
    })

    cy.dataCy("color-input").type(testColor)

    cy.dataCy("metric-value-text").should(($el) => {
      expect($el).to.have.css("color")
      expect(elColor($el).HEXA).to.equal(exp.HEXA)
    })
  })

  it("displays a skeleton while data is not valid", () => {
    cy.mount(DashboardMetricWrapper)

    cy.dataCy("data-valid-input").uncheck()

    cy.dataCy("metric-value-section").find(".q-skeleton").should("exist")

    cy.dataCy("data-valid-input").check()

    cy.dataCy("metric-value-section").find(".q-skeleton").should("not.exist")
  })
})
