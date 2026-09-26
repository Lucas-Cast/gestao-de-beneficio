import { DomainError } from '../errors/domain-error';
import { MAX_INTEGER_VALUE, MIN_POSITIVE_INTEGER } from './integer-limits';

export function validatePositiveInteger(value: number): number {
  if (
    !Number.isSafeInteger(value) ||
    value < MIN_POSITIVE_INTEGER ||
    value > MAX_INTEGER_VALUE
  ) {
    throw new DomainError('INVALID_QUANTITY');
  }
  return value;
}

export function validateStockQuantity(
  quantity: number,
  positive = false,
): number {
  if (positive) return validatePositiveInteger(quantity);

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    quantity > MAX_INTEGER_VALUE
  ) {
    throw new DomainError('INVALID_QUANTITY');
  }
  return quantity;
}

export function changeStockBalance(
  balance: number,
  type: 'IN' | 'OUT',
  quantity: number,
): number {
  validateStockQuantity(balance);
  validateStockQuantity(quantity, true);

  if (type === 'OUT') {
    if (balance < quantity) throw new DomainError('INSUFFICIENT_STOCK');
    return balance - quantity;
  }

  if (balance > MAX_INTEGER_VALUE - quantity)
    throw new DomainError('QUANTITY_OVERFLOW');
  return balance + quantity;
}

export function multiplyStockQuantity(quantity: number, count: number): number {
  validateStockQuantity(quantity, true);
  validatePositiveInteger(count);
  if (quantity > Math.floor(MAX_INTEGER_VALUE / count))
    throw new DomainError('QUANTITY_OVERFLOW');
  return quantity * count;
}
