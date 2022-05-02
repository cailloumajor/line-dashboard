import { mount } from "@cypress/vue"
import { mande } from "mande"
import { Response } from "miragejs"
import { z } from "zod"

import errorRedirectComposable from "composables/error-redirect"
import { makeServer } from "src/dev-api-server"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"

import LineInterfaceLayout from "../LineInterfaceLayout.vue"

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

describe("LineInterfaceLayout", () => {
  it("sets dark mode on", () => {
    mount(LineInterfaceLayout)

    cy.get("body").should("have.class", "body--dark")
  })

  it("gets its title from the common line interface config store", () => {
    mount(LineInterfaceLayout)

    cy.dataCy("layout-title").as("title")

    cy.get("@title").should("have.text", "⏳")

    cy.wrap(useCommonLineInterfaceConfigStore()).invoke("$patch", {
      title: "Test Title",
    })

    cy.get("@title").should("have.text", "Test Title")
  })

  it("displays loading state", () => {
    cy.clock().as("clock")

    mountWithSetupChild(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 1000)
      })
    })

    cy.tick(100)

    cy.dataCy("child").should("not.exist")
    cy.get(".q-loading").should("be.visible")

    cy.tick(1000)
    cy.get("@clock").invoke("restore")

    cy.dataCy("child").should("be.visible")
    cy.get(".q-loading").should("not.exist")
  })

  describe("redirects to error page", () => {
    beforeEach(() => {
      const server = makeServer()
      cy.wrap(server).as("api-server")
      const errorRedirectStub = cy.stub()
      cy.wrap(errorRedirectStub).as("error-redirect-stub")
      cy.stub(errorRedirectComposable, "useErrorRedirect").returns({
        errorRedirect: errorRedirectStub,
      })
    })

    afterEach(() => {
      cy.get("@api-server").invoke("shutdown")
    })

    it("on fetch error", () => {
      cy.get("@api-server").invoke("get", "/testurl", () => new Response(500))

      mountWithSetupChild(async () => {
        await mande("/testurl").get("")
      })

      cy.get("@error-redirect-stub").should("have.been.calledOnceWith", [
        Cypress.sinon
          .match("/testurl")
          .and(Cypress.sinon.match("500"))
          .and(Cypress.sinon.match("Internal Server Error")),
      ])
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

      cy.get("@error-redirect-stub").should("have.been.calledOnceWith", [
        Cypress.sinon.match("[Config Object].title:"),
        Cypress.sinon.match("[Config Object].params.first:"),
        Cypress.sinon.match("[Config Object].params.second:"),
        Cypress.sinon.match("[Config Object].list[1]:"),
      ])
    })
  })
})
