export const API_ROUTES = {
  auth: {
    login: '/users/login',
    register: '/users',
  },
  users: {
    collection: '/users',
    byId: (id: string) => `/users/${id}`,
  },
} as const;
