import EventEmitter from "events"

import MachineDataLinkBootWrapper from "app/test/cypress/wrappers/MachineDataLinkBootWrapper.vue"
import errorRedirectComposable from "src/composables/error-redirect"
import { heartbeatTimeout, maybeUint32 } from "src/composables/machine-data"
import { deps } from "src/composables/machine-data"
import { LinkStatus } from "src/global"
import { useMachineDataLinkStatusStore } from "src/stores/machine-data"

class MockedSubscription extends EventEmitter {
  constructor(private nodes?: (string | number)[]) {
    super()
  }

  publishData(changes: Record<string | number, unknown>) {
    const data = Object.fromEntries(
      Object.entries(changes).map(([k, v]) => [
        this.nodes?.findIndex((elem) => elem === maybeUint32(k)),
        v,
      ])
    )
    super.emit("publish", { data })
  }
}

class MockedCentrifuge extends EventEmitter {
  constructor() {
    super()
  }

  connect() {
    return null
  }

  disconnect() {
    return null
  }

  subscribe() {
    return null
  }
}

describe("machine data link boot composable", () => {
  beforeEach(() => {
    const errorRedirectStub = cy.stub()
    cy.wrap(errorRedirectStub).as("error-redirect-stub")
    cy.stub(errorRedirectComposable, "useErrorRedirect").returns({
      errorRedirect: errorRedirectStub,
    })
    const mockedHeartbeatSubscription = new MockedSubscription()
    cy.wrap(mockedHeartbeatSubscription).as("heartbeat-subscription")
    const mockedCentrifuge = new MockedCentrifuge()
    cy.wrap(mockedCentrifuge).as("centrifuge")
    cy.stub(mockedCentrifuge, "connect")
    cy.stub(mockedCentrifuge, "disconnect")
    cy.stub(mockedCentrifuge, "subscribe")
      .onFirstCall()
      .callsFake((channel, events, { data: { nodes } }) => {
        const mockedDataChangeSubscription = new MockedSubscription(nodes)
        cy.wrap(mockedDataChangeSubscription).as("data-change-subscription")
        return mockedDataChangeSubscription
      })
      .onSecondCall()
      .returns(mockedHeartbeatSubscription)
    cy.stub(deps, "Centrifuge").returns(mockedCentrifuge)
  })

  it("changes Centrifugo status on connection and disconnection", () => {
    cy.mount(MachineDataLinkBootWrapper)

    cy.wrap(useMachineDataLinkStatusStore()).as("store")

    cy.get("@store")
      .its("centrifugoLinkStatus")
      .should("equal", LinkStatus.Unknown)
    cy.get("@centrifuge").invoke("emit", "connect")
    cy.get("@store").its("centrifugoLinkStatus").should("equal", LinkStatus.Up)
    cy.get("@centrifuge").invoke("emit", "disconnect")
    cy.get("@store")
      .its("centrifugoLinkStatus")
      .should("equal", LinkStatus.Down)
  })

  it("subscribes to data changes and heartbeat", () => {
    cy.mount(MachineDataLinkBootWrapper, {
      props: {
        ns: "namespacefortesting",
        nsURI: "urn:unit.tests",
      },
    })

    cy.get("@centrifuge")
      .its("subscribe")
      .should(
        "have.been.calledWith",
        "namespacefortesting:machine-data@1000",
        undefined,
        Cypress.sinon.match
          .hasNested("data.namespaceURI", "urn:unit.tests")
          .and(
            Cypress.sinon.match.hasNested(
              "data.nodes",
              Cypress.sinon.match.array.contains(["first", 42])
            )
          )
      )
      .and("have.been.calledWith", "namespacefortesting:heartbeat")
  })

  context("on data change subscription error", () => {
    it("redirects to error page if not resubscribing", () => {
      cy.mount(MachineDataLinkBootWrapper)

      cy.get("@data-change-subscription").invoke("emit", "error", {
        message: "Testing subscription error",
      })

      cy.get("@error-redirect-stub").should("have.been.calledWithExactly", [
        "Testing subscription error",
      ])
    })

    it("does not redirect to error page if resubscribing", () => {
      cy.mount(MachineDataLinkBootWrapper)

      cy.get("@data-change-subscription").invoke("emit", "error", {
        message: "Testing subscription error",
        isResubscribe: true,
      })

      cy.get("@error-redirect-stub").should("not.have.been.called")
    })
  })

  it("updates machine data on data change publication", () => {
    cy.mount(MachineDataLinkBootWrapper)

    cy.get("@data-change-subscription").invoke("publishData", {
      first: 800,
    })
    cy.dataCy("first").should("have.text", 800)
    cy.dataCy("second").should("have.text", "initial")

    cy.get("@data-change-subscription").invoke("publishData", {
      "42": "changed-1",
    })
    cy.dataCy("first").should("have.text", 800)
    cy.dataCy("second").should("have.text", "changed-1")

    cy.get("@data-change-subscription").invoke("publishData", {
      first: 54,
      42: "changed-2",
    })
    cy.dataCy("first").should("have.text", 54)
    cy.dataCy("second").should("have.text", "changed-2")
  })

  it("changes proxy link status depending on publications", () => {
    cy.clock()

    cy.mount(MachineDataLinkBootWrapper)

    cy.wrap(useMachineDataLinkStatusStore()).as("store")

    cy.get("@store")
      .its("opcUaProxyLinkStatus")
      .should("equal", LinkStatus.Unknown)
    cy.get("@data-change-subscription").invoke("emit", "publish", { data: {} })
    cy.get("@store").its("opcUaProxyLinkStatus").should("equal", LinkStatus.Up)
    cy.tick(heartbeatTimeout + 500)
    cy.get("@store")
      .its("opcUaProxyLinkStatus")
      .should("equal", LinkStatus.Down)
    cy.get("@heartbeat-subscription").invoke("emit", "publish", {
      data: { status: null },
    })
    cy.tick(1000)
    cy.get("@store").its("opcUaProxyLinkStatus").should("equal", LinkStatus.Up)
    cy.tick(heartbeatTimeout + 500)
    cy.get("@store")
      .its("opcUaProxyLinkStatus")
      .should("equal", LinkStatus.Down)
  })

  it("changes OPC-UA link status depending on heartbeat publications", () => {
    cy.mount(MachineDataLinkBootWrapper)

    cy.wrap(useMachineDataLinkStatusStore()).as("store")

    cy.get("@store").its("opcUaLinkStatus").should("equal", LinkStatus.Unknown)
    cy.get("@heartbeat-subscription").invoke("emit", "publish", {
      data: { status: 0 },
    })
    cy.get("@store").its("opcUaLinkStatus").should("equal", LinkStatus.Up)
    cy.get("@heartbeat-subscription").invoke("emit", "publish", {
      data: { status: 1 },
    })
    cy.get("@store").its("opcUaLinkStatus").should("equal", LinkStatus.Down)
  })

  it("connects to Centrifugo", () => {
    cy.mount(MachineDataLinkBootWrapper)

    cy.get("@centrifuge").its("connect").should("have.been.called")
  })

  it("disconnects on unmount", () => {
    cy.mount(MachineDataLinkBootWrapper).as("wrapper")

    cy.get("@centrifuge").its("disconnect").should("not.have.been.called")
    cy.get("@wrapper").invoke("unmount")
    cy.get("@centrifuge").its("disconnect").should("have.been.called")
  })
})
