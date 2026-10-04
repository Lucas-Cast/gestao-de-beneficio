export const API_ROUTES = {
  auditLogs: { collection: "/audit-logs" },
  beneficiaries: {
    collection: "/beneficiaries",
    deleted: "/beneficiaries/deleted",
    byId: (id: string) => `/beneficiaries/${id}`,
    restore: (id: string) => `/beneficiaries/${id}/restore`,
  },
  baskets: { collection: "/baskets" },
  basketDeliveries: { collection: "/basket-deliveries" },
  auth: {
    login: "/users/login",
    register: "/users",
  },
  users: {
    collection: "/users",
    byId: (id: string) => `/users/${id}`,
  },
} as const;
