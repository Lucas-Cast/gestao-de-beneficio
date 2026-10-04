export const AUDIT_ENTITY_TYPES = ['BENEFICIARY', 'BASKET'] as const;
export type AuditEntity = (typeof AUDIT_ENTITY_TYPES)[number];
export type AuditValue =
  | string
  | number
  | boolean
  | null
  | AuditValue[]
  | { [key: string]: AuditValue };
export type AuditSnapshot = { [key: string]: AuditValue };

interface AuditRecord {
  id: string;
  entityType: AuditEntity;
  entityId: string;
  from: unknown;
  to: unknown;
  changedById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Timestamps alone do not turn an otherwise identical field into a business change.
function comparable(value: AuditValue): AuditValue {
  if (Array.isArray(value)) return value.map(comparable);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => key !== 'createdAt' && key !== 'updatedAt')
        .sort()
        .map((key) => [key, comparable(value[key])]),
    );
  }
  return value;
}

export class AuditDomain {
  private constructor(readonly record: AuditRecord) {}

  static fromPrisma(record: AuditRecord) {
    return new AuditDomain(record);
  }

  static fromPrismaMany(records: AuditRecord[]) {
    return records.map((record) => this.fromPrisma(record));
  }

  /** Inputs must be explicit, safe aggregate snapshots, never arbitrary Prisma relations. */
  static changes(
    before: object | null,
    after: object,
  ): {
    from: AuditSnapshot | null;
    to: AuditSnapshot;
  } {
    const next = JSON.parse(JSON.stringify(after)) as AuditSnapshot;
    if (before === null) return { from: null, to: next };
    const previous = JSON.parse(JSON.stringify(before)) as AuditSnapshot;
    const from: AuditSnapshot = {};
    const to: AuditSnapshot = {};
    for (const key of new Set([
      ...Object.keys(previous),
      ...Object.keys(next),
    ])) {
      if (key === 'createdAt' || key === 'updatedAt') continue;
      const oldValue = previous[key] ?? null;
      const newValue = next[key] ?? null;
      if (
        JSON.stringify(comparable(oldValue)) !==
        JSON.stringify(comparable(newValue))
      ) {
        from[key] = oldValue;
        to[key] = newValue;
      }
    }
    return { from, to };
  }
}
