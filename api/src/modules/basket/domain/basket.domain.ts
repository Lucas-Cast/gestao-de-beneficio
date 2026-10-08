import { validatePositiveInteger } from '../../../common/domain/stock-quantity';
import { DomainError } from '../../../common/errors/domain-error';
import { SupplyDomain } from '../../supply/domain/supply.domain';

interface BasketItemRecord {
  id: string;
  quantity: number;
  supply: Parameters<typeof SupplyDomain.fromPrisma>[0];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface BasketRecord {
  id: string;
  name: string;
  description: string | null;
  supplies: BasketItemRecord[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class BasketDomain {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly supplies: {
    id: string;
    quantity: number;
    supply: SupplyDomain;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly availableBasketCount: number;

  private constructor(record: BasketRecord) {
    this.id = record.id;
    this.name = record.name;
    this.description = record.description;
    this.supplies = record.supplies.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      supply: SupplyDomain.fromPrisma(item.supply),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
    }));
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
    this.deletedAt = record.deletedAt;
    this.availableBasketCount = this.calculateAvailableBasketCount();
  }

  private calculateAvailableBasketCount(): number {
    if (this.deletedAt !== null || this.supplies.length === 0) return 0;

    return Math.min(
      ...this.supplies.map((item) => {
        if (item.deletedAt !== null || item.supply.deletedAt !== null) return 0;
        return Math.max(
          0,
          Math.floor(item.supply.currentQuantity / item.quantity),
        );
      }),
    );
  }

  static validateComposition(items: { supplyId: string; quantity: number }[]) {
    if (items.length === 0) throw new DomainError('EMPTY_BASKET');
    const ids = new Set<string>();
    for (const item of items) {
      if (ids.has(item.supplyId))
        throw new DomainError('DUPLICATE_BASKET_SUPPLY');
      ids.add(item.supplyId);
      validatePositiveInteger(item.quantity);
    }
  }

  validateCanRestore() {
    if (this.supplies.some((item) => item.supply.deletedAt !== null))
      throw new DomainError('BASKET_HAS_DELETED_SUPPLY');
  }

  static fromPrisma(record: BasketRecord) {
    return new BasketDomain(record);
  }
  static fromPrismaMany(records: BasketRecord[]) {
    return records.map((record) => this.fromPrisma(record));
  }

  /** Catalog and stock changes belong to Supply, not to the basket's audit state. */
  auditSnapshot() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      supplies: this.supplies.map((item) => ({
        id: item.id,
        supplyId: item.supply.id,
        supplyName: item.supply.name,
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt,
      })),
    };
  }
}
