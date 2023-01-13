import { mande } from "mande"
import { Response } from "miragejs"
import { z } from "zod"

import errorRedirectComposable from "composables/error-redirect"
import { makeServer } from "src/dev-api-server"
import { LinkStatus } from "src/global"
import { useCampaignDataStore } from "stores/campaign-data"
import { useCommonLineInterfaceConfigStore } from "stores/common-line-interface-config"
import { useMachineDataLinkStatusStore } from "stores/machine-data-link"

import LineInterfaceLayout from "../LineInterfaceLayout.vue"

const checkIcons = (expStatuses: number[]) => {
  for (const [index, expStatus] of expStatuses.entries()) {
    const dataCy = ["centrifugo-status", "plc-status"][index]
    const expClass = ["text-warning", "text-negative", "text-positive"][
      expStatus
    ]
    const expText = ["question_mark", "link_off", "swap_horiz"][expStatus]
    cy.dataCy(dataCy)
      .find(".q-icon")
      .should("have.class", expClass)
      .and("have.text", expText)
  }
}

const statusCases = [
  [0, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 2, 0, 0],
  [1, 0, 1, 0],
  [1, 1, 1, 0],
  [1, 2, 1, 0],
  [2, 0, 2, 0],
  [2, 1, 2, 1],
  [2, 2, 2, 2],
]

const mountWithSetupChild = (setup: () => Promise<void>) =>
  cy.mount(LineInterfaceLayout, {
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
    cy.mount(LineInterfaceLayout)

    cy.get("body").should("have.class", "body--dark")
  })

  it("gets its title from stores", () => {
    cy.mount(LineInterfaceLayout)

    cy.dataCy("layout-title").as("title")

    cy.get("@title").should("have.text", "⏳\xa0—\xa0?")

    cy.wrap(useCommonLineInterfaceConfigStore()).invoke("$patch", {
      title: "Test Title",
    })
    cy.wrap(useCampaignDataStore()).invoke("$patch", {
      currentCampaign: "CAMPAIGN",
    })

    cy.get("@title").should("have.text", "Test Title\xa0—\xa0CAMPAIGN")
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

  describe("status icons", () => {
    for (const tc of statusCases) {
      const [centrifugoLinkStatus, plcLinkStatus, ...expStatuses] = tc

      it("displays statuses according to link states", () => {
        cy.mount(LineInterfaceLayout)

        cy.wrap(useMachineDataLinkStatusStore()).as("store")

        cy.get("@store").invoke("$patch", {
          centrifugoLinkStatus,
          plcLinkStatus,
        })

        checkIcons(expStatuses)
      })
    }

    it("displays Centrifugo transport", () => {
      cy.mount(LineInterfaceLayout)

      cy.wrap(useMachineDataLinkStatusStore()).as("store")

      cy.get("@store").invoke("$patch", {
        centrifugoTransport: "websocket",
      })
      cy.dataCy("centrifugo-transport")
        .should("have.class", "text-positive")
        .and("have.text", "(WS)")

      cy.get("@store").invoke("$patch", {
        centrifugoTransport: "sse",
      })
      cy.dataCy("centrifugo-transport")
        .should("have.class", "text-warning")
        .and("have.text", "(SSE)")

      cy.get("@store").invoke("$patch", {
        centrifugoTransport: "",
      })
      cy.dataCy("centrifugo-transport").should("not.be.visible")
    })

    it("displays PLC heartbeat state", () => {
      cy.mount(LineInterfaceLayout)

      cy.wrap(useMachineDataLinkStatusStore()).as("store")

      cy.get("@store").invoke("$patch", {
        plcHeartbeat: true,
      })

      cy.dataCy("heartbeat-icon").should("not.have.class", "text-positive")

      cy.get("@store").invoke("$patch", {
        centrifugoLinkStatus: LinkStatus.Up,
        plcLinkStatus: LinkStatus.Up,
      })

      cy.dataCy("heartbeat-icon").should("have.class", "text-positive")

      cy.get("@store").invoke("$patch", {
        plcHeartbeat: false,
      })

      cy.dataCy("heartbeat-icon").should("not.have.class", "text-positive")
    })
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
