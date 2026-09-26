import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { SupplyRepository } from '../src/modules/supply/supply.repository';
import { StockMovementRepository } from '../src/modules/stock-movement/stock-movement.repository';
import { MAX_INTEGER_VALUE } from '../src/common/domain/integer-limits';
import {
  createIntegrationApp,
  clearFixtures,
  IntegrationApp,
} from './helpers/integration-app';

describe('Inventory API (PostgreSQL)', () => {
  let fixture: IntegrationApp;
  let token: string;
  let actorId: string;
  const server = () => fixture.app.getHttpServer();
  const db = () => fixture.database;
  const post = (path: string, body: object) =>
    request(server()).post(path).auth(token, { type: 'bearer' }).send(body);
  const get = (path: string) =>
    request(server()).get(path).auth(token, { type: 'bearer' });

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
        email: 'operador@test.invalid',
        password: 'unused',
        isActive: true,
      },
    });
    actorId = actor.id;
    token = new JwtService({ secret: process.env.JWT_SECRET }).sign({
      sub: actor.id,
      role: actor.role,
    });
  });
  afterEach(() => jest.restoreAllMocks());

  async function supply(quantity = 0) {
    return db().supply.create({
      data: { name: randomUUID(), unit: 'KILOGRAM', currentQuantity: quantity },
    });
  }

  async function basket(stock = [10, 10], amounts = [2, 1]) {
    const beneficiary = await db().beneficiary.create({
      data: {
        name: 'Beneficiário',
        birthDate: new Date('1990-01-01'),
        sex: 'F',
        phone: '999999999',
        cpf: randomUUID(),
        address: {
          create: {
            street: 'Rua',
            number: '1',
            neighborhood: 'Centro',
            city: 'Belém',
            state: 'PA',
            postalCode: '66000000',
          },
        },
      },
    });
    const supplies = await Promise.all(
      stock.map((quantity) => supply(quantity)),
    );
    supplies.sort((a, b) => a.id.localeCompare(b.id));
    // Set stock after sorting so shortage tests deterministically fail after an earlier decrement.
    for (let i = 0; i < supplies.length; i++)
      await db().supply.update({
        where: { id: supplies[i].id },
        data: { currentQuantity: stock[i] },
      });
    const definition = await db().basket.create({
      data: {
        name: 'Cesta',
        supplies: {
          create: supplies.map((item, i) => ({
            supplyId: item.id,
            quantity: amounts[i],
          })),
        },
      },
    });
    return { beneficiaryId: beneficiary.id, basketId: definition.id, supplies };
  }

  it('creates default and explicit opening balances without movements, lists and updates metadata', async () => {
    const created = await post('/supplies', {
      name: 'Arroz',
      unit: 'KILOGRAM',
    }).expect(201);
    expect(created.body.currentQuantity).toBe(0);
    const initial = await post('/supplies', {
      name: 'Óleo',
      unit: 'LITER',
      currentQuantity: 12,
    }).expect(201);
    expect(initial.body.currentQuantity).toBe(12);
    expect(await db().stockMovement.count()).toBe(0);
    await request(server())
      .patch(`/supplies/${created.body.id}`)
      .auth(token, { type: 'bearer' })
      .send({
        name: 'Arroz integral',
        description: 'Descrição',
        unit: 'PACKAGE',
      })
      .expect(200);
    const listed = await get(
      '/supplies?search=arroz&unit=PACKAGE&pageSize=1',
    ).expect(200);
    expect(listed.body.total).toBe(1);
    expect(listed.body.data[0].name).toBe('Arroz integral');
    expect(
      (await get(`/supplies/${created.body.id}`)).body.currentQuantity,
    ).toBe(0);
  });

  it('rejects duplicate names, quantity edits, invalid/null fields and extra actor data in Portuguese', async () => {
    const created = await post('/supplies', {
      name: 'Arroz',
      unit: 'UNIT',
    }).expect(201);
    const duplicate = await post('/supplies', {
      name: 'Arroz',
      unit: 'UNIT',
    }).expect(409);
    expect(duplicate.body.message).toBe(
      'Já existe um registro com esses dados.',
    );
    const edited = await request(server())
      .patch(`/supplies/${created.body.id}`)
      .auth(token, { type: 'bearer' })
      .send({ currentQuantity: 99 })
      .expect(400);
    expect(edited.body.message).toContain(
      'currentQuantity: Este campo não é permitido.',
    );
    await request(server())
      .patch(`/supplies/${created.body.id}`)
      .auth(token, { type: 'bearer' })
      .send({ name: null, unit: null })
      .expect(400);
    for (const quantity of [-1, 1.5, MAX_INTEGER_VALUE + 1, null])
      await post('/supplies', {
        name: randomUUID(),
        unit: 'UNIT',
        currentQuantity: quantity,
      }).expect(400);
    await post('/stock-movements', {
      supplyId: created.body.id,
      type: 'IN',
      quantity: 1,
      performedById: actorId,
    }).expect(400);
  });

  it('preserves historical movements after supply soft deletion and blocks new operations', async () => {
    const item = await supply(5);
    await post('/stock-movements', {
      supplyId: item.id,
      type: 'OUT',
      quantity: 1,
    }).expect(201);
    await request(server())
      .delete(`/supplies/${item.id}`)
      .auth(token, { type: 'bearer' })
      .expect(204);
    await get(`/supplies/${item.id}`).expect(404);
    expect((await get('/supplies')).body.total).toBe(0);
    expect((await get(`/stock-movements?supplyId=${item.id}`)).body.total).toBe(
      1,
    );
    await post('/stock-movements', {
      supplyId: item.id,
      type: 'IN',
      quantity: 1,
    }).expect(404);
    expect(
      (await db().supply.findUniqueOrThrow({ where: { id: item.id } }))
        .deletedAt,
    ).not.toBeNull();
  });

  it('increments and decrements integer quantities, rejecting fractions and overflow', async () => {
    const item = await supply(10);
    const entry = await post('/stock-movements', {
      supplyId: item.id,
      type: 'IN',
      quantity: 20,
    }).expect(201);
    expect(entry.body).toMatchObject({
      performedById: actorId,
      quantity: 20,
      basketDeliveryId: null,
    });
    await post('/stock-movements', {
      supplyId: item.id,
      type: 'OUT',
      quantity: 1,
    }).expect(201);
    expect((await get(`/supplies/${item.id}`)).body.currentQuantity).toBe(29);
    for (const quantity of [0, -1, 0.5])
      await post('/stock-movements', {
        supplyId: item.id,
        type: 'IN',
        quantity,
      }).expect(400);
    const full = await supply(MAX_INTEGER_VALUE);
    await post('/stock-movements', {
      supplyId: full.id,
      type: 'IN',
      quantity: 1,
    }).expect(409);
  });

  it('rolls back a balance change if inserting its movement fails', async () => {
    const item = await supply(4);
    jest
      .spyOn(fixture.app.get(StockMovementRepository), 'create')
      .mockRejectedValueOnce(new Error('Internal SQL detail'));
    const failed = await post('/stock-movements', {
      supplyId: item.id,
      type: 'OUT',
      quantity: 2,
    }).expect(500);
    expect(failed.body.message).toBe('Ocorreu um erro interno.');
    expect((await get(`/supplies/${item.id}`)).body.currentQuantity).toBe(4);
    expect(await db().stockMovement.count()).toBe(0);
  });

  it('rejects insufficient stock without changing balance or history', async () => {
    const item = await supply(1);
    const failed = await post('/stock-movements', {
      supplyId: item.id,
      type: 'OUT',
      quantity: 2,
    }).expect(409);
    expect(failed.body.message).toBe('Estoque insuficiente.');
    expect((await get(`/supplies/${item.id}`)).body.currentQuantity).toBe(1);
    expect(await db().stockMovement.count()).toBe(0);
  });

  it('prevents overselling when two real transactions pass the initial stock check concurrently', async () => {
    const item = await supply(5);
    const repo = fixture.app.get(SupplyRepository);
    const change = repo.changeBalance.bind(repo);
    let entered = 0;
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    jest.spyOn(repo, 'changeBalance').mockImplementation(async (...args) => {
      if (++entered === 2) release();
      await barrier;
      return change(...args);
    });
    const responses = await Promise.all(
      [1, 2].map(() =>
        post('/stock-movements', {
          supplyId: item.id,
          type: 'OUT',
          quantity: 5,
        }),
      ),
    );
    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    expect((await get(`/supplies/${item.id}`)).body.currentQuantity).toBe(0);
    expect(await db().stockMovement.count()).toBe(1);
  });

  it('filters movement history by supply, type, actor, dates and paginates newest first', async () => {
    const first = await supply(10);
    const second = await supply();
    const entry = await post('/stock-movements', {
      supplyId: first.id,
      type: 'IN',
      quantity: 1,
    }).expect(201);
    await post('/stock-movements', {
      supplyId: first.id,
      type: 'OUT',
      quantity: 1,
    }).expect(201);
    await post('/stock-movements', {
      supplyId: second.id,
      type: 'IN',
      quantity: 1,
    }).expect(201);
    await db().stockMovement.update({
      where: { id: entry.body.id },
      data: { createdAt: new Date('2026-01-01T12:00:00Z') },
    });
    const result = await get(
      `/stock-movements?supplyId=${first.id}&type=IN&performedById=${actorId}&from=2026-01-01T00:00:00Z&to=2026-01-02T00:00:00Z`,
    ).expect(200);
    expect(result.body.total).toBe(1);
    expect(result.body.data[0].id).toBe(entry.body.id);
    const page = await get('/stock-movements?page=2&pageSize=2').expect(200);
    expect(page.body.total).toBe(3);
    expect(page.body.data).toHaveLength(1);
    expect(page.body.data[0].id).toBe(entry.body.id);
    await get('/stock-movements?from=2026-02-01&to=2026-01-01').expect(400);
    await get('/stock-movements?from=invalid').expect(400);
  });

  it('creates a delivery and its exact per-supply OUT movements with the authenticated actor', async () => {
    const definition = await basket();
    const result = await post('/basket-deliveries', {
      basketId: definition.basketId,
      beneficiaryId: definition.beneficiaryId,
      quantity: 2,
      observation: 'Entrega realizada.',
    }).expect(201);
    expect(result.body.deliveredById).toBe(actorId);
    expect(
      result.body.stockMovements.map(
        (movement: { quantity: number }) => movement.quantity,
      ),
    ).toEqual([4, 2]);
    expect(
      result.body.stockMovements.every(
        (movement: { basketDeliveryId: string; performedById: string }) =>
          movement.basketDeliveryId === result.body.id &&
          movement.performedById === actorId,
      ),
    ).toBe(true);
    expect(
      (await get(`/supplies/${definition.supplies[0].id}`)).body
        .currentQuantity,
    ).toBe(6);
    expect(
      (await get(`/supplies/${definition.supplies[1].id}`)).body
        .currentQuantity,
    ).toBe(8);
    expect(
      (await get(`/stock-movements?basketDeliveryId=${result.body.id}`)).body
        .total,
    ).toBe(2);
    await db().basketSupply.updateMany({
      where: { basketId: definition.basketId },
      data: { quantity: 9 },
    });
    expect(
      (
        await get(`/stock-movements?basketDeliveryId=${result.body.id}`)
      ).body.data
        .map((movement: { quantity: number }) => movement.quantity)
        .sort(),
    ).toEqual([2, 4]);
    await request(server())
      .delete(`/basket-deliveries/${result.body.id}`)
      .auth(token, { type: 'bearer' })
      .expect(404);
  });

  it('rolls back the entire delivery when its second supply is insufficient', async () => {
    const definition = await basket([10, 0]);
    await post('/basket-deliveries', {
      basketId: definition.basketId,
      beneficiaryId: definition.beneficiaryId,
    }).expect(409);
    expect(
      (await get(`/supplies/${definition.supplies[0].id}`)).body
        .currentQuantity,
    ).toBe(10);
    expect(await db().stockMovement.count()).toBe(0);
    expect(await db().basketDelivery.count()).toBe(0);
  });

  it('rejects empty baskets, deleted references, invalid basket counts and forged actors', async () => {
    const definition = await basket([], []);
    const body = {
      basketId: definition.basketId,
      beneficiaryId: definition.beneficiaryId,
    };
    expect(
      (await post('/basket-deliveries', body).expect(400)).body.message,
    ).toBe('A cesta deve conter pelo menos um mantimento.');
    for (const quantity of [0, -1, 1.5, null])
      await post('/basket-deliveries', { ...body, quantity }).expect(400);
    await post('/basket-deliveries', {
      ...body,
      deliveredById: actorId,
    }).expect(400);
    await db().beneficiary.update({
      where: { id: body.beneficiaryId },
      data: { deletedAt: new Date() },
    });
    await post('/basket-deliveries', body).expect(404);
    const another = await basket();
    await db().supply.update({
      where: { id: another.supplies[0].id },
      data: { deletedAt: new Date() },
    });
    await post('/basket-deliveries', {
      basketId: another.basketId,
      beneficiaryId: another.beneficiaryId,
    }).expect(404);
    await db().basket.update({
      where: { id: another.basketId },
      data: { deletedAt: new Date() },
    });
    await post('/basket-deliveries', {
      basketId: another.basketId,
      beneficiaryId: another.beneficiaryId,
    }).expect(404);
  });

  it('authenticates requests, rejects inactive actors and preserves safe known HTTP errors', async () => {
    expect(
      (await request(server()).get('/supplies').expect(401)).body.message,
    ).toBe('Autenticação necessária.');
    jest
      .spyOn(fixture.app.get(SupplyRepository), 'findAll')
      .mockRejectedValueOnce(new ConflictException('Conflito de teste.'));
    expect((await get('/supplies').expect(409)).body.message).toBe(
      'Conflito de teste.',
    );
    await db().user.update({
      where: { id: actorId },
      data: { isActive: false },
    });
    await get('/supplies').expect(401);
  });
});
