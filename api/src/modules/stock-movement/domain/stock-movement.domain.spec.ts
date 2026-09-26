import { StockMovementDomain } from './stock-movement.domain';
import { DomainError } from '../../../common/errors/domain-error';

describe('StockMovementDomain', () => {
  it('uses the movement type to add or subtract a positive quantity', () => {
    expect(StockMovementDomain.balanceAfter(2, 'IN', 3)).toBe(5);
    expect(StockMovementDomain.balanceAfter(5, 'OUT', 3)).toBe(2);
  });
  it.each([0, -1, 1.5])('rejects invalid movement quantity %s', (amount) => {
    expect(() => StockMovementDomain.balanceAfter(2, 'IN', amount)).toThrow(
      new DomainError('INVALID_QUANTITY'),
    );
  });
  it('rejects a balance below zero', () => {
    expect(() => StockMovementDomain.balanceAfter(2, 'OUT', 3)).toThrow(
      new DomainError('INSUFFICIENT_STOCK'),
    );
  });
});
