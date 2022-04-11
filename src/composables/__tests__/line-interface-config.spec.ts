import { mount } from "@cypress/vue"
import { Response } from "miragejs"

import LineInterfaceConfigWrapper from "app/test/cypress/wrappers/LineInterfaceConfigWrapper.vue"
import { loadingErrorStorageKey } from "src/constants"
import { makeServer } from "src/dev-api-server"
import { useCommonLineInterfaceConfigStore } from "src/stores/common-line-interface-config"

import type { RouterMock } from "vue-router-mock"

const errorRouteMatch = Cypress.sinon.match({
  name: "loadingError",
  query: { autoback: 30 },
})

describe("line interface configuration composable", () => {
  context("API not mocked", () => {
    it("requests the config document according to `id` prop", () => {
      cy.intercept("/couchdb/line-interface/*").as("req")

      mount(LineInterfaceConfigWrapper, {
        props: {
          id: "testid",
        },
      })

      cy.wait("@req")
        .its("request.url")
        .should("match", /\/couchdb\/line-interface\/testid$/)
    })
  })

  context("mocked API", () => {
    beforeEach(() => {
      const server = makeServer()
      cy.wrap(server).as("api-server")
    })

    afterEach(() => {
      cy.get("@api-server").invoke("shutdown")
    })

    it("redirects to error page on fetch error", () => {
      cy.get("@api-server").invoke(
        "get",
        "/couchdb/line-interface/:id",
        () => new Response(404)
      )

      mount(LineInterfaceConfigWrapper, {
        props: {
          id: "testid",
        },
      })

      cy.get("#q-loading").should("exist")
      cy.get<RouterMock>("@router-mock")
        .its("push")
        .should("have.been.calledOnceWith", errorRouteMatch)
      cy.window()
        .invoke("sessionStorage.getItem", loadingErrorStorageKey)
        .then((errorsJSON) => JSON.parse(errorsJSON))
        .should("have.length", 1)
        .and((errors) => {
          expect(errors[0]).to.contain("404")
        })
      cy.dataCy("first-param").should("not.exist")
      cy.dataCy("second-param").should("not.exist")
      cy.dataCy("list").should("not.exist")
      cy.get("#q-loading").should("exist")
    })

    it("redirects to error page on JSON parse error", () => {
      cy.get("@api-server").invoke(
        "get",
        "/couchdb/line-interface/:id",
        () => new Response(200, {}, "[")
      )

      mount(LineInterfaceConfigWrapper, {
        props: {
          id: "testid",
        },
      })

      cy.get("#q-loading").should("exist")
      cy.get<RouterMock>("@router-mock")
        .its("push")
        .should("have.been.calledOnceWith", errorRouteMatch)
      cy.window()
        .invoke("sessionStorage.getItem", loadingErrorStorageKey)
        .then((errorsJSON) => JSON.parse(errorsJSON))
        .should("have.length", 1)
        .and((errors) => {
          expect(errors[0]).to.contain("JSON parse error:")
        })
      cy.dataCy("first-param").should("not.exist")
      cy.dataCy("second-param").should("not.exist")
      cy.dataCy("list").should("not.exist")
      cy.get("#q-loading").should("exist")
    })

    it("redirects to error page on schema validation error", () => {
      cy.get("@api-server").invoke(
        "get",
        "/couchdb/line-interface/:id",
        () =>
          new Response(
            200,
            {},
            { params: { first: "", second: 42 }, list: [45, "wrong", 46] }
          )
      )

      mount(LineInterfaceConfigWrapper, {
        props: {
          id: "testid",
        },
      })

      cy.get("#q-loading").should("exist")
      cy.get<RouterMock>("@router-mock")
        .its("push")
        .should("have.been.calledOnceWith", errorRouteMatch)
      cy.window()
        .invoke("sessionStorage.getItem", loadingErrorStorageKey)
        .then((errorsJSON) => JSON.parse(errorsJSON))
        .should("have.length", 4)
        .and((errors) => {
          expect(errors[0]).to.contain("[Config Object].title:")
          expect(errors[1]).to.contain("[Config Object].params.first:")
          expect(errors[2]).to.contain("[Config Object].params.second:")
          expect(errors[3]).to.contain("[Config Object].list[1]:")
        })
      cy.dataCy("first-param").should("not.exist")
      cy.dataCy("second-param").should("not.exist")
      cy.dataCy("list").should("not.exist")
      cy.get("#q-loading").should("exist")
    })

    it("succeeds", () => {
      cy.get("@api-server").invoke(
        "get",
        "/couchdb/line-interface/:id",
        () =>
          new Response(
            200,
            {},
            {
              title: "Title for tests",
              params: { first: "test", second: false },
              list: [45, 46],
            }
          )
      )

      mount(LineInterfaceConfigWrapper, {
        props: {
          id: "testid",
        },
      })

      cy.get("#q-loading").should("not.exist")
      cy.get<RouterMock>("@router-mock")
        .its("push")
        .should("not.have.been.called")
      cy.wrap(useCommonLineInterfaceConfigStore())
        .its("title")
        .should("equal", "Title for tests")
      cy.dataCy("first-param").should("have.text", "First param: test")
      cy.dataCy("second-param").should("have.text", "Second param: false")
      cy.dataCy("list")
        .should("have.length", 2)
        .and((item) => {
          expect(item[0]).to.have.text("45")
          expect(item[1]).to.have.text("46")
        })
    })
  })
})
