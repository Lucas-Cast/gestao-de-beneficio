import { changeStockBalance, multiplyStockQuantity } from './stock-quantity';
import { DomainError } from '../errors/domain-error';
import { MAX_INTEGER_VALUE, MIN_POSITIVE_INTEGER } from './integer-limits';

describe('stock quantity', () => {
  it('adds and subtracts whole units', () => {
    expect(changeStockBalance(2, 'IN', 3)).toBe(5);
    expect(changeStockBalance(5, 'OUT', 3)).toBe(2);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER])(
    'rejects invalid movement quantity %p',
    (quantity) => {
      expect(() => changeStockBalance(5, 'IN', quantity)).toThrow(
        new DomainError('INVALID_QUANTITY'),
      );
    },
  );

  it('rejects negative balances and integer overflow', () => {
    expect(() => changeStockBalance(2, 'OUT', 3)).toThrow(
      new DomainError('INSUFFICIENT_STOCK'),
    );
    expect(() =>
      changeStockBalance(MAX_INTEGER_VALUE, 'IN', MIN_POSITIVE_INTEGER),
    ).toThrow(new DomainError('QUANTITY_OVERFLOW'));
  });

  it('multiplies basket item quantities by whole basket counts', () => {
    expect(multiplyStockQuantity(2, 3)).toBe(6);
    expect(() => multiplyStockQuantity(2, 1.5)).toThrow(
      new DomainError('INVALID_QUANTITY'),
    );
    expect(() =>
      multiplyStockQuantity(MAX_INTEGER_VALUE, MIN_POSITIVE_INTEGER + 1),
    ).toThrow(new DomainError('QUANTITY_OVERFLOW'));
  });
});
