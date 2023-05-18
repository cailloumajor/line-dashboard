import EventEmitter from "events"

import MachineDataLinkBootWrapper from "app/test/cypress/wrappers/MachineDataLinkBootWrapper.vue"
import errorRedirectComposable from "composables/error-redirect"
import { heartbeatTimeoutMillis } from "composables/machine-data"
import { deps } from "composables/machine-data"
import { LinkStatus } from "src/global"
import { useCampaignDataStore } from "stores/campaign-data"
import { useMachineDataLinkStatusStore } from "stores/machine-data-link"

class MockedSubscription extends EventEmitter {
  constructor() {
    super()
  }

  subscribe() {
    return null
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

  newSubscription() {
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
    const mockedCentrifuge = new MockedCentrifuge()
    cy.wrap(mockedCentrifuge).as("centrifuge")
    cy.stub(mockedCentrifuge, "connect")
    cy.stub(mockedCentrifuge, "disconnect")
    cy.stub(mockedCentrifuge, "newSubscription").callsFake(() => {
      const mockedDataChangeSubscription = new MockedSubscription()
      cy.stub(mockedDataChangeSubscription, "subscribe")
      cy.wrap(mockedDataChangeSubscription).as("data-change-subscription")
      return mockedDataChangeSubscription
    })
    cy.stub(deps, "Centrifuge").returns(mockedCentrifuge)
  })

  it("changes Centrifugo status on connection and disconnection", () => {
    const getStore = () =>
      cy.get<ReturnType<typeof useMachineDataLinkStatusStore>>("@store")

    cy.mount(MachineDataLinkBootWrapper)

    cy.wrap(useMachineDataLinkStatusStore()).as("store")

    cy.get("@store")
      .its("centrifugoLinkStatus")
      .should("equal", LinkStatus.Unknown)
    cy.get("@centrifuge").invoke("emit", "connected", {
      transport: "some_transport",
    })
    getStore().should((store) => {
      expect(store.centrifugoLinkStatus).to.equal(LinkStatus.Up)
      expect(store.centrifugoTransport).to.equal("some_transport")
    })
    cy.get("@centrifuge").invoke("emit", "disconnected")
    getStore().should((store) => {
      expect(store.centrifugoLinkStatus).to.equal(LinkStatus.Down)
      expect(store.centrifugoTransport).to.equal("")
    })
  })

  it("subscribes to data changes", () => {
    cy.mount(MachineDataLinkBootWrapper, {
      props: {
        partnerID: "testid",
      },
    })

    cy.get("@centrifuge")
      .its("newSubscription")
      .should("have.been.calledWith", "opcua.data:testid")
    cy.get("@data-change-subscription")
      .its("subscribe")
      .should("have.been.calledOnce")
  })

  context("when data change subscription is unsubscribed", () => {
    it("redirects to error page", () => {
      cy.mount(MachineDataLinkBootWrapper)

      cy.get("@data-change-subscription").invoke("emit", "unsubscribed", {
        channel: "somechannel",
        reason: "Testing unsubscribed event",
      })

      cy.get("@error-redirect-stub").should("have.been.calledWithExactly", [
        "`somechannel` Centrifugo channel unsubscribed: Testing unsubscribed event",
      ])
    })
  })

  it("gets initial data on subscription", () => {
    cy.mount(MachineDataLinkBootWrapper)

    cy.wrap(useMachineDataLinkStatusStore()).as("store")
    cy.get("@store").its("plcLinkStatus").should("equal", LinkStatus.Unknown)

    cy.get("@data-change-subscription").invoke("emit", "subscribed", {
      data: {
        val: {
          first: 42,
          second: "somevalue",
        },
        ts: {
          one: "tsone",
          two: "tstwo",
        },
      },
    })
    cy.get("@store").its("plcLinkStatus").should("equal", LinkStatus.Up)
    cy.dataCy("first").should("have.text", 42)
    cy.dataCy("second").should("have.text", "somevalue")
    cy.dataCy("ts-one").should("have.text", "tsone")
    cy.dataCy("ts-two").should("have.text", "tstwo")
  })

  it("accepts publications with undefined data", () => {
    cy.mount(MachineDataLinkBootWrapper)

    // No exception should be emitted.
    cy.get("@data-change-subscription").invoke("emit", "subscribed", {})
    cy.get("@data-change-subscription").invoke("emit", "publication", {})
  })

  it("updates machine data on data change publication", () => {
    cy.mount(MachineDataLinkBootWrapper)

    cy.get("@data-change-subscription").invoke("emit", "publication", {
      data: {
        val: {
          first: 800,
        },
        ts: {
          one: "sometime",
        },
      },
    })
    cy.dataCy("first").should("have.text", 800)
    cy.dataCy("second").should("have.text", "initial")
    cy.dataCy("ts-one").should("have.text", "sometime")
    cy.dataCy("ts-two").should("have.text", "other_ts")

    cy.get("@data-change-subscription").invoke("emit", "publication", {
      data: {
        val: {
          second: "changed-1",
        },
        ts: {
          two: "anytime",
        },
      },
    })
    cy.dataCy("first").should("have.text", 800)
    cy.dataCy("second").should("have.text", "changed-1")
    cy.dataCy("ts-one").should("have.text", "sometime")
    cy.dataCy("ts-two").should("have.text", "anytime")

    cy.get("@data-change-subscription").invoke("emit", "publication", {
      data: {
        val: {
          first: 54,
          second: "changed-2",
        },
        ts: {
          one: "far",
          two: "past",
        },
      },
    })
    cy.dataCy("first").should("have.text", 54)
    cy.dataCy("second").should("have.text", "changed-2")
    cy.dataCy("ts-one").should("have.text", "far")
    cy.dataCy("ts-two").should("have.text", "past")
  })

  it("changes PLC link status depending on publications", () => {
    cy.clock()

    cy.mount(MachineDataLinkBootWrapper)

    cy.wrap(useMachineDataLinkStatusStore()).as("store")

    cy.get("@store").its("plcLinkStatus").should("equal", LinkStatus.Unknown)
    cy.get("@data-change-subscription").invoke("emit", "publication", {
      data: {},
    })
    cy.get("@store").its("plcLinkStatus").should("equal", LinkStatus.Up)
    cy.tick(heartbeatTimeoutMillis + 500)
    cy.get("@store").its("plcLinkStatus").should("equal", LinkStatus.Down)
  })

  it("updates PLC heartbeat state in the store", () => {
    cy.mount(MachineDataLinkBootWrapper)

    cy.wrap(useMachineDataLinkStatusStore()).as("store")

    cy.get("@store").its("plcHeartbeat").should("be.false")
    cy.get("@data-change-subscription").invoke("emit", "publication", {
      data: {
        val: {
          heartbeat: true,
        },
      },
    })
    cy.get("@store").its("plcHeartbeat").should("be.true")
    cy.get("@data-change-subscription").invoke("emit", "publication", {
      data: {
        val: {
          heartbeat: false,
        },
      },
    })
    cy.get("@store").its("plcHeartbeat").should("be.false")
  })

  it("calls the store action on campaign change", () => {
    cy.mount(MachineDataLinkBootWrapper)

    cy.get("@data-change-subscription").invoke("emit", "publication", {
      data: {
        val: {
          partRef: "NEW-REFERENCE",
        },
      },
    })
    cy.wrap(useCampaignDataStore())
      .its("updateCampaign")
      .should("have.been.calledOnceWithExactly", "NEW-REFERENCE")
  })

  it("connects to Centrifugo", () => {
    cy.mount(MachineDataLinkBootWrapper)

    cy.get("@centrifuge").its("connect").should("have.been.called")
  })

  it("disconnects on unmount", () => {
    cy.mount(MachineDataLinkBootWrapper).its("wrapper").as("wrapper")

    cy.get("@centrifuge").its("disconnect").should("not.have.been.called")
    cy.get("@wrapper").invoke("unmount")
    cy.get("@centrifuge").its("disconnect").should("have.been.called")
  })
})
