import {
  multiplyStockQuantity,
  validatePositiveInteger,
} from '../../../common/domain/stock-quantity';
import { DomainError } from '../../../common/errors/domain-error';

interface DeliveryRecord {
  id: string;
  basketId: string;
  beneficiaryId: string;
  deliveredById: string;
  quantity: number;
  observation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BasketDeliveryDomain {
  readonly id: string;
  readonly basketId: string;
  readonly beneficiaryId: string;
  readonly deliveredById: string;
  readonly quantity: number;
  readonly observation: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(record: DeliveryRecord) {
    this.id = record.id;
    this.basketId = record.basketId;
    this.beneficiaryId = record.beneficiaryId;
    this.deliveredById = record.deliveredById;
    this.quantity = record.quantity;
    this.observation = record.observation;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }

  static consumption(
    items: { supplyId: string; quantity: number }[],
    count: number,
  ) {
    validatePositiveInteger(count);
    if (items.length === 0) throw new DomainError('EMPTY_BASKET');
    return items
      .map((item) => ({
        supplyId: item.supplyId,
        quantity: multiplyStockQuantity(item.quantity, count),
      }))
      .sort((a, b) => a.supplyId.localeCompare(b.supplyId));
  }

  static fromPrisma(record: DeliveryRecord) {
    return new BasketDeliveryDomain(record);
  }
  static fromPrismaMany(records: DeliveryRecord[]) {
    return records.map((record) => this.fromPrisma(record));
  }
}
