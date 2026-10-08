export type ManagedUserRole = "ADMIN" | "COMMON";
export type ManagedUserStatus = "ACTIVE" | "INACTIVE" | "";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: ManagedUserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ManagedUserPage = {
  data: ManagedUser[];
  total: number;
  page: number;
  pageSize: number;
};
