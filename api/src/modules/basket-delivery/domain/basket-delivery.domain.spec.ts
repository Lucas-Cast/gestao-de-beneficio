import { BasketDeliveryDomain } from './basket-delivery.domain';
import { DomainError } from '../../../common/errors/domain-error';
import { MAX_INTEGER_VALUE } from '../../../common/domain/integer-limits';

describe('BasketDeliveryDomain', () => {
  const items = [
    { supplyId: 'b', quantity: 1 },
    { supplyId: 'a', quantity: 2 },
  ];
  it('multiplies whole basket quantities and orders supplies consistently', () => {
    expect(BasketDeliveryDomain.consumption(items, 3)).toEqual([
      { supplyId: 'a', quantity: 6 },
      { supplyId: 'b', quantity: 3 },
    ]);
  });
  it.each([0, -1, 1.5, MAX_INTEGER_VALUE + 1])(
    'rejects invalid basket count %p',
    (count) => {
      expect(() => BasketDeliveryDomain.consumption(items, count)).toThrow(
        new DomainError('INVALID_QUANTITY'),
      );
    },
  );
  it('rejects empty baskets and invalid item quantities', () => {
    expect(() => BasketDeliveryDomain.consumption([], 1)).toThrow(
      new DomainError('EMPTY_BASKET'),
    );
    expect(() =>
      BasketDeliveryDomain.consumption([{ supplyId: 'a', quantity: 0 }], 1),
    ).toThrow(new DomainError('INVALID_QUANTITY'));
  });
});
