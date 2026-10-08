import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AuditRepository } from '../src/modules/audit/audit.repository';
import { BeneficiaryRepository } from '../src/modules/beneficiary/beneficiary.repository';
import {
  clearFixtures,
  createIntegrationApp,
  IntegrationApp,
} from './helpers/integration-app';

describe('Beneficiaries, baskets and audit (PostgreSQL)', () => {
  let fixture: IntegrationApp;
  let token: string;
  let actorId: string;
  const db = () => fixture.database;
  const server = () => fixture.app.getHttpServer();
  const post = (path: string, body: object) =>
    request(server()).post(path).auth(token, { type: 'bearer' }).send(body);
  const patch = (path: string, body: object) =>
    request(server()).patch(path).auth(token, { type: 'bearer' }).send(body);
  const get = (path: string) =>
    request(server()).get(path).auth(token, { type: 'bearer' });
  const remove = (path: string) =>
    request(server()).delete(path).auth(token, { type: 'bearer' });
  const beneficiaryBody = {
    name: 'Ana',
    birthDate: '1990-01-01',
    sex: 'F',
    cpf: '529.982.247-25',
    phone: '(91) 99999-9999',
    address: {
      street: 'Rua A',
      number: '15',
      complement: 'Casa',
      neighborhood: 'Centro',
      city: 'Belém',
      state: 'PA',
      postalCode: '66000-000',
    },
  };
  const createBeneficiary = (changes = {}) =>
    post('/beneficiaries', { ...beneficiaryBody, ...changes }).expect(201);
  const logs = (entityId: unknown) => {
    if (typeof entityId !== 'string')
      throw new Error('Expected an entity ID in the API response');
    return db().auditLog.findMany({
      where: { entityId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  };

  beforeAll(async () => {
    fixture = await createIntegrationApp();
  });
  afterAll(async () => {
    await fixture?.close();
  });
  beforeEach(async () => {
    await clearFixtures(db());
    const actor = await db().user.create({
      data: {
        name: 'Operador',
        email: 'operator@test.invalid',
        password: 'never-return-this',
        isActive: true,
      },
    });
    actorId = actor.id;
    token = new JwtService({ secret: process.env.JWT_SECRET }).sign({
      sub: actorId,
      role: actor.role,
    });
  });
  afterEach(() => jest.restoreAllMocks());

  async function createBasket() {
    const supply = await db().supply.create({
      data: { name: randomUUID(), unit: 'KILOGRAM', currentQuantity: 20 },
    });
    const body = {
      name: 'Cesta básica',
      supplies: [{ supplyId: supply.id, quantity: 2 }],
    };
    const response = await post('/baskets', body).expect(201);
    return { response, supply, body };
  }

  function failAfterAuditInsert() {
    jest.restoreAllMocks();
    const repository = fixture.app.get(AuditRepository);
    const original = repository.create.bind(repository);
    return jest
      .spyOn(repository, 'create')
      .mockImplementationOnce(async (tx, data) => {
        await original(tx, data);
        throw new Error('Internal audit failure: never expose this detail');
      });
  }

  it('creates an aggregate, returns nested address, paginates and audits with the authenticated actor', async () => {
    const created = await createBeneficiary();
    expect(created.body).toMatchObject({
      name: 'Ana',
      cpf: '52998224725',
      phone: '91999999999',
      birthDate: '1990-01-01',
      address: { city: 'Belém', postalCode: '66000000' },
      deletedAt: null,
    });
    expect(created.body).not.toHaveProperty('addressId');
    const [audit] = await logs(created.body.id);
    expect(audit).toMatchObject({
      entityType: 'BENEFICIARY',
      entityId: created.body.id,
      changedById: actorId,
      from: null,
      to: created.body,
    });
    expect(audit.createdAt).toBeInstanceOf(Date);
    expect(audit.updatedAt).toBeInstanceOf(Date);
    await createBeneficiary({ name: 'Outra', cpf: '11144477735' });
    expect(
      (await get('/beneficiaries?search=ana&cpf=52998224725').expect(200)).body
        .total,
    ).toBe(1);
    const first = (await get('/beneficiaries?pageSize=1').expect(200)).body;
    const second = (await get('/beneficiaries?pageSize=1&page=2').expect(200))
      .body;
    expect(first.total).toBe(2);
    expect(first.data[0].id).not.toBe(second.data[0].id);
    await get('/beneficiaries/' + created.body.id).expect(200);
    expect(await db().auditLog.count()).toBe(2);
  });

  it('lists audit changes by entity type, entity, actor and page without exposing credentials', async () => {
    const beneficiary = await createBeneficiary();
    await patch('/beneficiaries/' + beneficiary.body.id, {
      name: 'Ana Souza',
    }).expect(200);
    const basket = await createBasket();

    const first = await get('/audit-logs')
      .query({ entityType: 'BENEFICIARY', pageSize: 1 })
      .expect(200);
    expect(first.body).toMatchObject({ total: 2, page: 1, pageSize: 1 });
    expect(first.body.data[0]).toMatchObject({
      entityType: 'BENEFICIARY',
      entityId: beneficiary.body.id,
      from: { name: 'Ana' },
      to: { name: 'Ana Souza' },
      changedBy: { id: actorId, name: 'Operador' },
    });
    expect(first.body.data[0]).not.toHaveProperty('changedById');
    expect(first.body.data[0].changedBy).not.toHaveProperty('password');

    const second = await get('/audit-logs')
      .query({ entityType: 'BENEFICIARY', pageSize: 1, page: 2 })
      .expect(200);
    expect(second.body.total).toBe(2);
    expect(second.body.data[0].id).not.toBe(first.body.data[0].id);

    const baskets = await get('/audit-logs')
      .query({ entityType: 'BASKET' })
      .expect(200);
    expect(baskets.body.data).toEqual([
      expect.objectContaining({ entityId: basket.response.body.id }),
    ]);
    expect(
      (
        await get('/audit-logs')
          .query({ entityId: beneficiary.body.id })
          .expect(200)
      ).body.total,
    ).toBe(2);
    expect(
      (await get('/audit-logs').query({ changedById: actorId }).expect(200))
        .body.total,
    ).toBe(3);
    expect((await get('/audit-logs').expect(200)).body.total).toBe(3);

    await request(server()).get('/audit-logs').expect(401);
    await get('/audit-logs').query({ entityType: 'USER' }).expect(400);
    await get('/audit-logs').query({ entityId: 'invalid' }).expect(400);
    await get('/audit-logs').query({ pageSize: 101 }).expect(400);
    await get('/audit-logs')
      .query({
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-09-01T00:00:00.000Z',
      })
      .expect(400);
  });

  it('updates only requested fields, audits address changes and keeps the address when omitted', async () => {
    const created = await createBeneficiary();
    const updated = await patch('/beneficiaries/' + created.body.id, {
      name: 'Ana Souza',
      address: { city: 'Ananindeua', complement: null },
    }).expect(200);
    expect(updated.body.address).toMatchObject({
      id: created.body.address.id,
      city: 'Ananindeua',
      complement: null,
      street: 'Rua A',
    });
    const audit = (await logs(created.body.id))[1];
    expect(audit.from).toEqual({ name: 'Ana', address: created.body.address });
    expect(audit.to).toEqual({
      name: 'Ana Souza',
      address: updated.body.address,
    });
    const renamed = await patch('/beneficiaries/' + created.body.id, {
      name: 'Ana Maria',
    }).expect(200);
    expect(renamed.body.address).toEqual(updated.body.address);
    await patch('/beneficiaries/' + created.body.id, {}).expect(200);
    const noOp = (await logs(created.body.id)).at(-1)!;
    expect(noOp.from).toEqual({});
    expect(noOp.to).toEqual({});
  });

  it('enforces CPF uniqueness and rolls back nested changes when an update conflicts', async () => {
    await createBeneficiary();
    const other = await createBeneficiary({
      name: 'Outra',
      cpf: '11144477735',
    });
    await post('/beneficiaries', beneficiaryBody).expect(409);
    const conflict = await patch('/beneficiaries/' + other.body.id, {
      cpf: '52998224725',
      address: { city: 'Outra cidade' },
    }).expect(409);
    expect(conflict.body.message).toBe(
      'Já existe um registro com esses dados.',
    );
    expect(
      (await get('/beneficiaries/' + other.body.id)).body.address.city,
    ).toBe('Belém');
    expect(await db().address.count()).toBe(2);
    expect(await db().auditLog.count()).toBe(2);
  });

  it('lists soft-deleted beneficiaries and restores them with an audit entry', async () => {
    const created = await createBeneficiary();
    await remove('/beneficiaries/' + created.body.id).expect(204);

    // The unique CPF constraint includes soft-deleted rows.
    await post('/beneficiaries', beneficiaryBody).expect(409);
    expect((await get('/beneficiaries').expect(200)).body.total).toBe(0);

    const deleted = await get('/beneficiaries/deleted?search=Ana').expect(200);
    expect(deleted.body).toMatchObject({
      total: 1,
      data: [{ id: created.body.id, deletedAt: expect.any(String) }],
    });

    const restored = await patch(
      '/beneficiaries/' + created.body.id + '/restore',
      {},
    ).expect(200);
    expect(restored.body.deletedAt).toBeNull();
    expect((await get('/beneficiaries/deleted').expect(200)).body.total).toBe(
      0,
    );
    expect((await get('/beneficiaries').expect(200)).body.total).toBe(1);

    const history = await logs(created.body.id);
    expect(history).toHaveLength(3);
    expect(history[2].changedById).toBe(actorId);
    expect(history[2].from).toMatchObject({ deletedAt: expect.any(String) });
    expect(history[2].to).toMatchObject({ deletedAt: null });
  });

  it('requires an active JWT and rejects spoofed actors and invalid fields in Portuguese', async () => {
    await request(server()).get('/beneficiaries').expect(401);
    await request(server()).get('/baskets').expect(401);
    const invalid = await post('/beneficiaries', {
      ...beneficiaryBody,
      cpf: '11111111111',
      changedById: randomUUID(),
    }).expect(400);
    expect(invalid.body.message).toEqual(
      expect.arrayContaining([
        'Informe um CPF válido.',
        'changedById: Este campo não é permitido.',
      ]),
    );
    expect(await db().beneficiary.count()).toBe(0);
    expect(await db().auditLog.count()).toBe(0);
    // Both existing roles use the same authenticated API.
    await db().user.update({ where: { id: actorId }, data: { role: 'ADMIN' } });
    const adminToken = new JwtService({ secret: process.env.JWT_SECRET }).sign({
      sub: actorId,
      role: 'ADMIN',
    });
    await request(server())
      .post('/beneficiaries')
      .auth(adminToken, { type: 'bearer' })
      .send(beneficiaryBody)
      .expect(201);
    await db().user.update({
      where: { id: actorId },
      data: { isActive: false },
    });
    await get('/beneficiaries').expect(401);
  });

  it('creates immutable baskets with complete supply responses, duplicate names and no stock change', async () => {
    const { response, supply, body } = await createBasket();
    expect(response.body.supplies[0]).toMatchObject({
      quantity: 2,
      supply: { id: supply.id, name: supply.name, currentQuantity: 20 },
    });
    expect(response.body.supplies[0]).not.toHaveProperty('supplyId');
    expect(response.body.supplies[0]).not.toHaveProperty('basketId');
    const [audit] = await logs(response.body.id);
    expect(audit.from).toBeNull();
    expect(audit.to).toMatchObject({
      supplies: [{ supplyId: supply.id, quantity: 2 }],
    });
    expect(JSON.stringify(audit.to)).not.toContain('currentQuantity');
    await post('/baskets', body).expect(201);
    expect(
      (await get('/baskets?search=básica&pageSize=1').expect(200)).body,
    ).toMatchObject({ total: 2, page: 1, pageSize: 1 });
    await get('/baskets/' + response.body.id).expect(200);
    await patch('/baskets/' + response.body.id, { name: 'Outra' }).expect(404);
    expect(await db().stockMovement.count()).toBe(0);
    expect(
      (await db().supply.findUniqueOrThrow({ where: { id: supply.id } }))
        .currentQuantity,
    ).toBe(20);
    expect(await db().auditLog.count()).toBe(2);
  });

  it('rejects invalid compositions and missing/deleted supplies without creating partial baskets', async () => {
    const { supply } = await createBasket();
    const invalid = [
      [],
      [{ supplyId: supply.id, quantity: 0 }],
      [{ supplyId: supply.id, quantity: 1.5 }],
      [
        { supplyId: supply.id, quantity: 1 },
        { supplyId: supply.id, quantity: 2 },
      ],
    ];
    for (const supplies of invalid)
      await post('/baskets', { name: 'Inválida', supplies }).expect(400);
    await post('/baskets', {
      name: 'Inexistente',
      supplies: [{ supplyId: randomUUID(), quantity: 1 }],
    }).expect(404);
    await db().supply.update({
      where: { id: supply.id },
      data: { deletedAt: new Date() },
    });
    await post('/baskets', {
      name: 'Excluído',
      supplies: [{ supplyId: supply.id, quantity: 1 }],
    }).expect(404);
    expect(await db().basket.count()).toBe(1);
    expect(await db().basketSupply.count()).toBe(1);
    expect(await db().auditLog.count()).toBe(1);
  });

  it('soft-deletes aggregates, retains history and blocks new deliveries and repeated deletion', async () => {
    const beneficiary = (await createBeneficiary()).body;
    const { response: basket } = await createBasket();
    const delivery = await post('/basket-deliveries', {
      beneficiaryId: beneficiary.id,
      basketId: basket.body.id,
      quantity: 2,
    }).expect(201);
    expect(await db().auditLog.count()).toBe(2);
    await remove('/baskets/' + basket.body.id).expect(204);
    await get('/baskets/' + basket.body.id).expect(404);
    await remove('/baskets/' + basket.body.id).expect(404);
    expect((await get('/baskets')).body.total).toBe(0);
    expect(
      await db().basketSupply.count({
        where: { basketId: basket.body.id, deletedAt: null },
      }),
    ).toBe(0);
    expect(
      await db().basketSupply.count({ where: { basketId: basket.body.id } }),
    ).toBe(1);
    const deletion = (await logs(basket.body.id)).at(-1)!;
    expect(deletion.from).toMatchObject({
      deletedAt: null,
      supplies: [{ quantity: 2 }],
    });
    expect(deletion.to).toMatchObject({
      supplies: [],
      deletedAt: expect.any(String),
    });
    await post('/basket-deliveries', {
      beneficiaryId: beneficiary.id,
      basketId: basket.body.id,
    }).expect(404);
    const activeBasket = await createBasket();
    await remove('/beneficiaries/' + beneficiary.id).expect(204);
    await get('/beneficiaries/' + beneficiary.id).expect(404);
    await patch('/beneficiaries/' + beneficiary.id, { name: 'Outra' }).expect(
      404,
    );
    await remove('/beneficiaries/' + beneficiary.id).expect(404);
    expect((await get('/beneficiaries')).body.total).toBe(0);
    expect(
      await db().address.count({ where: { id: beneficiary.address.id } }),
    ).toBe(1);
    const beneficiaryDeletion = (await logs(beneficiary.id)).at(-1)!;
    expect(beneficiaryDeletion.from).toEqual({ deletedAt: null });
    expect(beneficiaryDeletion.to).toEqual({ deletedAt: expect.any(String) });
    await post('/basket-deliveries', {
      beneficiaryId: beneficiary.id,
      basketId: activeBasket.response.body.id,
    }).expect(404);
    await post('/beneficiaries', beneficiaryBody).expect(409);
    expect(
      await db().basketDelivery.count({ where: { id: delivery.body.id } }),
    ).toBe(1);
    expect(
      await db().stockMovement.findFirst({
        where: { basketDeliveryId: delivery.body.id },
      }),
    ).toMatchObject({ quantity: 4, type: 'OUT' });
  });

  it('lists deleted baskets and restores the basket composition with an audit entry', async () => {
    const { response: created } = await createBasket();
    await remove('/baskets/' + created.body.id).expect(204);

    const deleted = await get('/baskets/deleted?search=básica').expect(200);
    expect(deleted.body).toMatchObject({
      total: 1,
      data: [
        {
          id: created.body.id,
          deletedAt: expect.any(String),
          supplies: [
            {
              quantity: 2,
              deletedAt: expect.any(String),
              supply: { id: expect.any(String), deletedAt: null },
            },
          ],
        },
      ],
    });

    const restored = await patch(
      '/baskets/' + created.body.id + '/restore',
      {},
    ).expect(200);
    expect(restored.body).toMatchObject({
      id: created.body.id,
      deletedAt: null,
      supplies: [{ quantity: 2, deletedAt: null }],
    });
    expect((await get('/baskets/deleted').expect(200)).body.total).toBe(0);
    expect((await get('/baskets').expect(200)).body.total).toBe(1);

    const history = await logs(created.body.id);
    expect(history).toHaveLength(3);
    expect(history[2]).toMatchObject({
      entityType: 'BASKET',
      changedById: actorId,
      from: { deletedAt: expect.any(String) },
      to: { deletedAt: null },
    });
    expect(history[2].from).toMatchObject({
      supplies: [{ supplyId: expect.any(String), quantity: 2 }],
    });
    expect(history[2].to).toMatchObject({
      supplies: [{ supplyId: expect.any(String), quantity: 2 }],
    });
  });

  it('filters and paginates soft-deleted baskets', async () => {
    const first = await createBasket();
    const second = await createBasket();
    await remove('/baskets/' + first.response.body.id).expect(204);
    await remove('/baskets/' + second.response.body.id).expect(204);

    const page1 = await get('/baskets/deleted')
      .query({ search: 'BÁSICA', page: 1, pageSize: 1 })
      .expect(200);
    const page2 = await get('/baskets/deleted')
      .query({ search: 'básica', page: 2, pageSize: 1 })
      .expect(200);
    expect(page1.body).toMatchObject({ total: 2, page: 1, pageSize: 1 });
    expect(page2.body).toMatchObject({ total: 2, page: 2, pageSize: 1 });
    expect(page1.body.data[0].id).not.toBe(page2.body.data[0].id);
  });

  it('does not restore a basket whose supply is soft-deleted and keeps the operation atomic', async () => {
    const { response: created, supply } = await createBasket();
    await remove('/baskets/' + created.body.id).expect(204);
    await db().supply.update({
      where: { id: supply.id },
      data: { deletedAt: new Date() },
    });

    const response = await patch(
      '/baskets/' + created.body.id + '/restore',
      {},
    ).expect(409);
    expect(response.body.message).toBe(
      'Esta cesta contém mantimentos excluídos e não pode ser restaurada.',
    );
    expect((await get('/baskets/deleted').expect(200)).body.total).toBe(1);
    expect((await get('/baskets').expect(200)).body.total).toBe(0);
    expect(
      await db().basketSupply.count({
        where: { basketId: created.body.id, deletedAt: null },
      }),
    ).toBe(0);
    expect(
      await db().auditLog.count({ where: { entityId: created.body.id } }),
    ).toBe(2);
  });

  it('rejects restoring a basket that is not currently deleted', async () => {
    const { response: created } = await createBasket();
    const response = await patch(
      '/baskets/' + created.body.id + '/restore',
      {},
    ).expect(404);
    expect(response.body.message).toBe('Cesta não encontrada ou excluída.');
  });

  it('rolls back basket restoration and child links when audit insertion fails', async () => {
    const { response: created } = await createBasket();
    await remove('/baskets/' + created.body.id).expect(204);
    failAfterAuditInsert();

    const response = await patch(
      '/baskets/' + created.body.id + '/restore',
      {},
    ).expect(500);
    expect(JSON.stringify(response.body)).not.toContain(
      'Internal audit failure',
    );
    expect((await get('/baskets/deleted').expect(200)).body.total).toBe(1);
    expect((await get('/baskets').expect(200)).body.total).toBe(0);
    expect(
      await db().basketSupply.count({
        where: { basketId: created.body.id, deletedAt: null },
      }),
    ).toBe(0);
    expect(
      await db().auditLog.count({ where: { entityId: created.body.id } }),
    ).toBe(2);
  });

  it('rolls back beneficiary, address and audit even when failure happens after audit insertion', async () => {
    failAfterAuditInsert();
    const response = await post('/beneficiaries', beneficiaryBody).expect(500);
    expect(JSON.stringify(response.body)).not.toContain(
      'Internal audit failure',
    );
    expect(await db().beneficiary.count()).toBe(0);
    expect(await db().address.count()).toBe(0);
    expect(await db().auditLog.count()).toBe(0);
  });

  it('rolls back beneficiary edits and deletion when audit insertion fails', async () => {
    const created = (await createBeneficiary()).body;
    failAfterAuditInsert();
    await patch('/beneficiaries/' + created.id, {
      name: 'Outra',
      address: { city: 'Outra cidade' },
    }).expect(500);
    expect((await get('/beneficiaries/' + created.id)).body).toEqual(created);
    failAfterAuditInsert();
    await remove('/beneficiaries/' + created.id).expect(500);
    expect(
      (await get('/beneficiaries/' + created.id)).body.deletedAt,
    ).toBeNull();
    expect(await db().auditLog.count()).toBe(1);
  });

  it('rolls back basket creation and child-row deletion when auditing fails', async () => {
    const { response, body } = await createBasket();
    failAfterAuditInsert();
    await post('/baskets', body).expect(500);
    expect(await db().basket.count()).toBe(1);
    expect(await db().basketSupply.count()).toBe(1);
    failAfterAuditInsert();
    await remove('/baskets/' + response.body.id).expect(500);
    expect(
      (await get('/baskets/' + response.body.id)).body.deletedAt,
    ).toBeNull();
    expect(await db().basketSupply.count({ where: { deletedAt: null } })).toBe(
      1,
    );
    expect(await db().auditLog.count()).toBe(1);
  });

  it('allows a generic entity ID while enforcing the actor foreign key', async () => {
    const entityId = randomUUID();
    await db().auditLog.create({
      data: {
        entityType: 'BENEFICIARY',
        entityId,
        changedById: actorId,
        to: { name: 'Historical entity' },
      },
    });
    expect(
      await db().beneficiary.findUnique({ where: { id: entityId } }),
    ).toBeNull();
    await expect(
      db().auditLog.create({
        data: {
          entityType: 'BASKET',
          entityId,
          changedById: randomUUID(),
          to: {},
        },
      }),
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('prevents concurrent beneficiary edits from recording stale before-values', async () => {
    const created = (await createBeneficiary()).body;
    const repository = fixture.app.get(BeneficiaryRepository);
    const original = repository.update.bind(repository);
    let arrived = 0;
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    const spy = jest
      .spyOn(repository, 'update')
      .mockImplementation(async (tx, id, data) => {
        arrived++;
        if (arrived === 2) release();
        await barrier;
        return original(tx, id, data);
      });
    let responses: request.Response[];
    try {
      responses = await Promise.all([
        patch('/beneficiaries/' + created.id, { name: 'Primeira' }),
        patch('/beneficiaries/' + created.id, { name: 'Segunda' }),
      ]);
    } finally {
      release();
      spy.mockRestore();
    }
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
    const current = (await get('/beneficiaries/' + created.id)).body;
    const changes = await logs(created.id);
    expect(changes).toHaveLength(2);
    expect(changes[1].from).toEqual({ name: 'Ana' });
    expect(changes[1].to).toEqual({ name: current.name });
    const retryName = current.name === 'Primeira' ? 'Segunda' : 'Primeira';
    await patch('/beneficiaries/' + created.id, { name: retryName }).expect(
      200,
    );
    expect((await logs(created.id)).at(-1)?.from).toEqual({
      name: current.name,
    });
  });
});
