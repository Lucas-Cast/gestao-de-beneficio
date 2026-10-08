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

  it('calculates how many complete baskets the current stock can assemble', () => {
    const now = new Date();
    const basket = BasketDomain.fromPrisma({
      id: 'basket-id',
      name: 'Cesta',
      description: null,
      supplies: [
        {
          id: 'rice-item',
          quantity: 2,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          supply: {
            id: 'rice-id',
            name: 'Arroz',
            description: null,
            unit: 'KILOGRAM',
            currentQuantity: 10,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          },
        },
        {
          id: 'beans-item',
          quantity: 1,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          supply: {
            id: 'beans-id',
            name: 'Feijão',
            description: null,
            unit: 'KILOGRAM',
            currentQuantity: 3,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    expect(basket.availableBasketCount).toBe(3);
    expect(basket.auditSnapshot()).not.toHaveProperty('availableBasketCount');
  });

  it('reports zero available baskets when a required supply is deleted', () => {
    const now = new Date();
    const basket = BasketDomain.fromPrisma({
      id: 'basket-id',
      name: 'Cesta',
      description: null,
      supplies: [
        {
          id: 'basket-supply-id',
          quantity: 2,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          supply: {
            id: 'supply-id',
            name: 'Arroz',
            description: null,
            unit: 'KILOGRAM',
            currentQuantity: 10,
            createdAt: now,
            updatedAt: now,
            deletedAt: now,
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    expect(basket.availableBasketCount).toBe(0);
  });

  it('allows restoring a basket when all of its supplies are active', () => {
    const now = new Date();
    const basket = BasketDomain.fromPrisma({
      id: 'basket-id',
      name: 'Cesta',
      description: null,
      supplies: [
        {
          id: 'basket-supply-id',
          quantity: 2,
          createdAt: now,
          updatedAt: now,
          deletedAt: now,
          supply: {
            id: 'supply-id',
            name: 'Arroz',
            description: null,
            unit: 'KILOGRAM',
            currentQuantity: 10,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
      deletedAt: now,
    });

    expect(() => basket.validateCanRestore()).not.toThrow();
  });

  it('rejects restoring a basket with a deleted supply', () => {
    const now = new Date();
    const basket = BasketDomain.fromPrisma({
      id: 'basket-id',
      name: 'Cesta',
      description: null,
      supplies: [
        {
          id: 'basket-supply-id',
          quantity: 2,
          createdAt: now,
          updatedAt: now,
          deletedAt: now,
          supply: {
            id: 'supply-id',
            name: 'Arroz',
            description: null,
            unit: 'KILOGRAM',
            currentQuantity: 10,
            createdAt: now,
            updatedAt: now,
            deletedAt: now,
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
      deletedAt: now,
    });

    expect(() => basket.validateCanRestore()).toThrow(
      new DomainError('BASKET_HAS_DELETED_SUPPLY'),
    );
  });
});
