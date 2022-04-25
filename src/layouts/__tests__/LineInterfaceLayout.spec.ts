import { mount } from "@cypress/vue"
import { createTestingPinia } from "@pinia/testing"
import { mande } from "mande"
import { Response } from "miragejs"
import { SessionStorage } from "quasar"
import { z } from "zod"

import { makeServer } from "src/dev-api-server"
import { loadingErrorStorageKey } from "src/global"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"

import LineInterfaceLayout from "../LineInterfaceLayout.vue"

import type { RouterMock } from "vue-router-mock"

const mountWithSetupChild = (setup: () => Promise<void>) =>
  mount(LineInterfaceLayout, {
    global: {
      stubs: {
        RouterView: {
          template: '<div data-cy="child">CHILD</div>',
          setup,
        },
      },
    },
  })

const checkErrorRedirect = () => {
  cy.get<RouterMock>("@router-mock")
    .its("push")
    .should(
      "have.been.calledOnceWith",
      Cypress.sinon.match({ name: "loadingError", query: { autoback: 30 } })
    )
  return cy
    .wrap(SessionStorage)
    .invoke("getItem", loadingErrorStorageKey) as Cypress.Chainable<string[]>
}

describe("LineInterfaceLayout", () => {
  it("sets dark mode on", () => {
    mount(LineInterfaceLayout)

    cy.get("body").should("have.class", "body--dark")
  })

  it("gets its title from the common line interface config store", () => {
    mount(LineInterfaceLayout, {
      global: {
        plugins: [createTestingPinia({ createSpy: Cypress.sinon.spy })],
      },
    })

    cy.dataCy("layout-title").as("title")

    cy.get("@title").should("have.text", "⏳")

    cy.wrap(useCommonLineInterfaceConfigStore()).invoke("$patch", {
      title: "Test Title",
    })

    cy.get("@title").should("have.text", "Test Title")
  })

  describe("redirects to error page", () => {
    beforeEach(() => {
      const server = makeServer()
      cy.wrap(server).as("api-server")
    })

    afterEach(() => {
      cy.get("@api-server").invoke("shutdown")
    })

    it("on fetch error", () => {
      cy.get("@api-server").invoke("get", "/testurl", () => new Response(418))

      mountWithSetupChild(async () => {
        await mande("/testurl").get("")
      })

      checkErrorRedirect()
        .should("have.length", 1)
        .its(0)
        .should("include", "/testurl")
        .and("include", "418")
    })

    it("on schema validation error", () => {
      const schema = z.object({
        title: z.string(),
        params: z.object({
          first: z.string().min(1),
          second: z.boolean(),
        }),
        list: z.array(z.number()),
      })

      mountWithSetupChild(async () => {
        await schema.parseAsync({
          params: { first: "", second: 42 },
          list: [45, "wrong", 46],
        })
      })

      checkErrorRedirect()
        .should("have.length", 4)
        .and((errors) => {
          expect(errors[0]).to.contain("[Config Object].title:")
          expect(errors[1]).to.contain("[Config Object].params.first:")
          expect(errors[2]).to.contain("[Config Object].params.second:")
          expect(errors[3]).to.contain("[Config Object].list[1]:")
        })
    })
  })
})
