export type UserRole = "ADMIN" | "COMMON";

export type AuthUser = {
  name: string;
  email: string;
  role: UserRole;
};
