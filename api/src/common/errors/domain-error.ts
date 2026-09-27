export type DomainErrorCode =
  | 'INVALID_QUANTITY'
  | 'INSUFFICIENT_STOCK'
  | 'QUANTITY_OVERFLOW'
  | 'EMPTY_BASKET'
  | 'DUPLICATE_BASKET_SUPPLY'
  | 'SUPPLY_NOT_FOUND'
  | 'BASKET_NOT_FOUND'
  | 'BENEFICIARY_NOT_FOUND'
  | 'INACTIVE_USER'
  | 'INVALID_DATE_RANGE';

export class DomainError extends Error {
  constructor(readonly code: DomainErrorCode) {
    super(code);
    this.name = 'DomainError';
  }
}
