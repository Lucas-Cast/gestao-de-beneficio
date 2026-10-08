export const API_ROUTES = {
  auditLogs: { collection: "/audit-logs" },
  beneficiaries: {
    collection: "/beneficiaries",
    deleted: "/beneficiaries/deleted",
    byId: (id: string) => `/beneficiaries/${id}`,
    restore: (id: string) => `/beneficiaries/${id}/restore`,
  },
  baskets: {
    collection: "/baskets",
    deleted: "/baskets/deleted",
    byId: (id: string) => `/baskets/${id}`,
    restore: (id: string) => `/baskets/${id}/restore`,
  },
  basketDeliveries: {
    collection: "/basket-deliveries",
    stats: "/basket-deliveries/stats",
  },
  supplies: {
    collection: "/supplies",
    byId: (id: string) => `/supplies/${id}`,
  },
  stockMovements: { collection: "/stock-movements" },
  auth: {
    login: "/users/login",
    register: "/users",
  },
  users: {
    collection: "/users",
    byId: (id: string) => `/users/${id}`,
    status: (id: string) => `/users/${id}/status`,
  },
} as const;
