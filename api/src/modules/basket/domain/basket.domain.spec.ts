import { DomainError } from '../../../common/errors/domain-error';
import { MAX_INTEGER_VALUE } from '../../../common/domain/integer-limits';
import { BasketDomain } from './basket.domain';

describe('BasketDomain', () => {
  it('rejects empty or duplicate compositions', () => {
    expect(() => BasketDomain.validateComposition([])).toThrow(
      new DomainError('EMPTY_BASKET'),
    );
    expect(() =>
      BasketDomain.validateComposition([
        { supplyId: 'a', quantity: 2 },
        { supplyId: 'a', quantity: 1 },
      ]),
    ).toThrow(new DomainError('DUPLICATE_BASKET_SUPPLY'));
  });

  it.each([0, -1, 1.5, MAX_INTEGER_VALUE + 1])(
    'rejects invalid quantity %s',
    (quantity) => {
      expect(() =>
        BasketDomain.validateComposition([{ supplyId: 'a', quantity }]),
      ).toThrow(new DomainError('INVALID_QUANTITY'));
    },
  );

  it('accepts a non-empty composition and keeps quantities untouched', () => {
    const items = [
      { supplyId: 'a', quantity: 2 },
      { supplyId: 'b', quantity: 5 },
    ];
    BasketDomain.validateComposition(items);
    expect(items).toEqual([
      { supplyId: 'a', quantity: 2 },
      { supplyId: 'b', quantity: 5 },
    ]);
  });
});
