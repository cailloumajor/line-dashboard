import { mount } from "@cypress/vue"
import { ColorTranslator } from "colortranslator"
import { colors } from "quasar"
import { h, ref } from "vue"

import DashboardMetric from "../DashboardMetric.vue"

const { getPaletteColor } = colors

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
    const exp = new ColorTranslator(getPaletteColor(testColor))
    const elColor = ($el: JQuery<HTMLElement>) =>
      new ColorTranslator($el.css("color"))

    const color = ref<string>()

    mount(DashboardMetric, {
      props: {
        value: 42,
        color,
        dataValid: true,
      },
    })

    cy.dataCy("metric-value-text").should(($el) => {
      expect($el).to.have.css("color")
      expect(elColor($el).HEXA).to.not.equal(exp.HEXA)
    })

    cy.wrap(color).then((ref) => {
      ref.value = testColor
    })

    cy.dataCy("metric-value-text").should(($el) => {
      expect($el).to.have.css("color")
      expect(elColor($el).HEXA).to.equal(exp.HEXA)
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
