import { useUserFacingLayoutStore } from "src/stores/user-facing-layout"

import UserFacingLayout from "../UserFacingLayout.vue"

describe("UserFacingLayout", () => {
  it("gets title extension from the store", () => {
    cy.mount(UserFacingLayout)

    cy.wrap(useUserFacingLayoutStore()).invoke("$patch", {
      titleExtension: "some extension",
    })

    cy.dataCy("layout-title").should("contain.text", "some extension")
  })
})
