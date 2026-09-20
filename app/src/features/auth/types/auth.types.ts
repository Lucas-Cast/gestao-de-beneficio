export type AuthUser = {
  name: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  name: string;
  email: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};
