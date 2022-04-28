import type { RouteRecordRaw } from "vue-router"

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("layouts/MainLayout.vue"),
    children: [{ path: "", component: () => import("pages/IndexPage.vue") }],
  },

  {
    path: "/",
    component: () => import("layouts/LineInterfaceLayout.vue"),
    children: [
      {
        path: "line-dashboard/:id",
        name: "lineDashboard",
        components: {
          default: () => import("pages/LineDashboard.vue"),
          statuses: () => import("components/DashboardStatuses.vue"),
        },
        props: {
          default: true,
          statuses: false,
        },
      },
    ],
  },

  {
    path: "/loading-error",
    name: "loadingError",
    component: () => import("pages/ErrorDashboardLoading.vue"),
    props: (route) => {
      const n = Number(route.query.autoback)
      const autoback = Number.isInteger(n) && n > 0 ? n : undefined
      return { autoback }
    },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    name: "notFound",
    component: () => import("pages/ErrorNotFound.vue"),
  },
]

export default routes
