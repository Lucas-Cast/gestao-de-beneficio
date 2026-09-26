import { changeStockBalance } from '../../../common/domain/stock-quantity';

export const MOVEMENT_TYPES = ['IN', 'OUT'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];
interface MovementRecord {
  id: string;
  supplyId: string;
  performedById: string;
  basketDeliveryId: string | null;
  type: MovementType;
  quantity: number;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class StockMovementDomain {
  readonly id: string;
  readonly supplyId: string;
  readonly performedById: string;
  readonly basketDeliveryId: string | null;
  readonly type: MovementType;
  readonly quantity: number;
  readonly reason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(record: MovementRecord) {
    this.id = record.id;
    this.supplyId = record.supplyId;
    this.performedById = record.performedById;
    this.basketDeliveryId = record.basketDeliveryId;
    this.type = record.type;
    this.quantity = record.quantity;
    this.reason = record.reason;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
    this.deletedAt = record.deletedAt;
  }

  static balanceAfter(
    balance: number,
    type: MovementType,
    quantity: number,
  ): number {
    return changeStockBalance(balance, type, quantity);
  }

  static fromPrisma(record: MovementRecord) {
    return new StockMovementDomain(record);
  }
  static fromPrismaMany(records: MovementRecord[]) {
    return records.map((record) => this.fromPrisma(record));
  }
}
