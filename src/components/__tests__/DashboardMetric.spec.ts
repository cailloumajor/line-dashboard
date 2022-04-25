import { mount } from "@cypress/vue"
import Color from "color"
import { colors } from "quasar"
import { h, ref } from "vue"

import DashboardMetric from "../DashboardMetric.vue"

const { getPaletteColor } = colors

const fontSize = (elem: JQuery) =>
  parseInt(elem.css("font-size").replace(/px$/, ""))

describe("DashboardMetric", () => {
  it("shows fallback title if slot is not provided", () => {
    mount(DashboardMetric, {
      props: {
        value: 42,
        dataValid: true,
      },
    })

    cy.dataCy("metric-title-content").should("have.text", "???")
  })

  it("renders the title from default slot", () => {
    mount(DashboardMetric, {
      props: {
        value: 42,
        dataValid: true,
      },
      slots: {
        default: h("code", {}, "Title slot"),
      },
    })

    cy.dataCy("metric-title-content").should(
      "have.html",
      "<code>Title slot</code>"
    )
  })

  it("displays value according to props", () => {
    mount(DashboardMetric, {
      props: {
        value: 5616,
        dataValid: true,
      },
    })

    cy.dataCy("metric-value-text").should("have.text", "5616")
  })

  it("renders the value with color according to prop", () => {
    const testColor = "negative"
    const exp = Color(getPaletteColor(testColor))

    const color = ref<string>()

    mount(DashboardMetric, {
      props: {
        value: 42,
        color,
        dataValid: true,
      },
    })

    cy.dataCy("metric-value-text")
      .should("have.css", "color")
      .and((colorString) => {
        expect(Color(colorString).hexa()).to.not.equal(exp.hexa())
      })

    cy.wrap(color).then((ref) => {
      ref.value = testColor
    })

    cy.dataCy("metric-value-text")
      .should("have.css", "color")
      .and((colorString) => {
        expect(Color(colorString).hexa()).to.equal(exp.hexa())
      })
  })

  it("sets font size when page height prop changes", () => {
    const pageHeight = ref(0)

    mount(DashboardMetric, {
      props: {
        value: 42,
        dataValid: true,
        pageHeight,
      },
    })

    cy.get(".q-card").then((elem) => {
      elem.height(100)
    })

    cy.dataCy("metric-title-content").should((elem) => {
      expect(fontSize(elem)).not.to.be.closeTo(20, 2)
    })
    cy.dataCy("metric-value-text").should((elem) => {
      expect(fontSize(elem)).not.to.be.closeTo(80, 2)
    })

    cy.wrap(pageHeight).then((ref) => {
      ref.value = 1
    })

    cy.dataCy("metric-title-content").should((elem) => {
      expect(fontSize(elem)).to.be.closeTo(20, 2)
    })
    cy.dataCy("metric-value-text").should((elem) => {
      expect(fontSize(elem)).to.be.closeTo(80, 2)
    })
  })

  it("displays a skeleton while data is not valid", () => {
    const dataValid = ref(false)

    mount(DashboardMetric, {
      props: {
        value: 42,
        dataValid,
      },
    })

    cy.dataCy("metric-value-section").find(".q-skeleton").should("exist")

    cy.wrap(dataValid).then((ref) => {
      ref.value = true
    })

    cy.dataCy("metric-value-section").find(".q-skeleton").should("not.exist")
  })
})
