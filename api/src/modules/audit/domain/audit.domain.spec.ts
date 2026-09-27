import { AuditDomain } from './audit.domain';

describe('AuditDomain', () => {
  it('records the persisted aggregate on creation and serializes dates', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    expect(
      AuditDomain.changes(null, {
        id: 'a',
        createdAt,
        address: { city: 'Belém' },
      }),
    ).toEqual({
      from: null,
      to: {
        id: 'a',
        createdAt: createdAt.toISOString(),
        address: { city: 'Belém' },
      },
    });
  });

  it('includes only changed fields and the full address when its business fields change', () => {
    const before = {
      name: 'Ana',
      cpf: '52998224725',
      address: { city: 'Belém', complement: 'Casa', updatedAt: 'old' },
      updatedAt: 'old',
    };
    const after = {
      ...before,
      name: 'Ana Souza',
      address: { city: 'Belém', complement: null, updatedAt: 'new' },
      updatedAt: 'new',
    };
    expect(AuditDomain.changes(before, after)).toEqual({
      from: { name: 'Ana', address: before.address },
      to: { name: 'Ana Souza', address: after.address },
    });
  });

  it('does not report automatic timestamps or property order as business changes', () => {
    expect(
      AuditDomain.changes(
        {
          name: 'Ana',
          address: { city: 'Belém', state: 'PA', updatedAt: 'old' },
          updatedAt: 'old',
        },
        {
          name: 'Ana',
          address: { state: 'PA', city: 'Belém', updatedAt: 'new' },
          updatedAt: 'new',
        },
      ),
    ).toEqual({ from: {}, to: {} });
  });

  it('records cascade soft deletion as a lifecycle and active-composition change', () => {
    const supplies = [{ supplyId: 'a', quantity: 2 }];
    const deletedAt = new Date('2026-01-02T00:00:00Z');
    expect(
      AuditDomain.changes(
        { name: 'Cesta', supplies, deletedAt: null },
        { name: 'Cesta', supplies: [], deletedAt },
      ),
    ).toEqual({
      from: { supplies, deletedAt: null },
      to: { supplies: [], deletedAt: deletedAt.toISOString() },
    });
  });
});
