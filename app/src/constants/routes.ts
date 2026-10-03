export const API_ROUTES = {
  beneficiaries: { collection: "/beneficiaries" },
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
