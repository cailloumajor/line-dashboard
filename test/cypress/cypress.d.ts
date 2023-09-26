import type { mount } from "cypress/vue"
import type { Router } from "vue-router"

type MountParams = Parameters<typeof mount>
type MountReturn = ReturnType<typeof mount>
type OptionsParam = MountParams[1] & { router?: Router }

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Helper mount function for Vue Components
       * @param component Vue Component or JSX Element to mount
       * @param options Options passed to Vue Test Utils
       */
      mount(component: MountParams[0], options?: OptionsParam): MountReturn
    }
  }
}
