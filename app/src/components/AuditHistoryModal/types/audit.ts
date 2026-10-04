export const AUDIT_ENTITY_TYPES = ["BENEFICIARY", "BASKET"] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export type AuditLog = {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  from: Record<string, unknown> | null;
  to: Record<string, unknown> | null;
  changedBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type AuditLogPage = {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
};

export type AuditLogFilters = {
  entityType: AuditEntityType;
  entityId?: string;
  changedById?: string;
  from?: string;
  to?: string;
};
