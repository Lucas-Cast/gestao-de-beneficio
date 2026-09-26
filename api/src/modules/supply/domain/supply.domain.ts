export const SUPPLY_UNITS = [
  'UNIT',
  'KILOGRAM',
  'GRAM',
  'LITER',
  'MILLILITER',
  'PACKAGE',
] as const;
export type SupplyUnit = (typeof SUPPLY_UNITS)[number];

interface SupplyRecord {
  id: string;
  name: string;
  description: string | null;
  unit: SupplyUnit;
  currentQuantity: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class SupplyDomain {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly unit: SupplyUnit;
  readonly currentQuantity: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(record: SupplyRecord) {
    this.id = record.id;
    this.name = record.name;
    this.description = record.description;
    this.unit = record.unit;
    this.currentQuantity = record.currentQuantity;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
    this.deletedAt = record.deletedAt;
  }

  static fromPrisma(record: SupplyRecord): SupplyDomain {
    return new SupplyDomain(record);
  }
  static fromPrismaMany(records: SupplyRecord[]): SupplyDomain[] {
    return records.map((record) => this.fromPrisma(record));
  }
}
