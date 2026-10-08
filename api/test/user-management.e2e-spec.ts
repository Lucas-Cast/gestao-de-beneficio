import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

import {
  clearFixtures,
  createIntegrationApp,
  IntegrationApp,
} from './helpers/integration-app';

describe('User administration (PostgreSQL)', () => {
  let fixture: IntegrationApp;
  let adminId: string;
  let commonId: string;
  let inactiveId: string;
  let adminToken: string;
  let commonToken: string;

  const db = () => fixture.database;
  const server = () => fixture.app.getHttpServer();
  const get = (path: string, token = adminToken) =>
    request(server()).get(path).auth(token, { type: 'bearer' });
  const patch = (path: string, body: object, token = adminToken) =>
    request(server()).patch(path).auth(token, { type: 'bearer' }).send(body);
  const remove = (path: string, token = adminToken) =>
    request(server()).delete(path).auth(token, { type: 'bearer' });

  beforeAll(async () => {
    fixture = await createIntegrationApp();
  });

  afterAll(async () => {
    await fixture?.close();
  });

  beforeEach(async () => {
    await clearFixtures(db());
    const [admin, common, inactive] = await Promise.all([
      db().user.create({
        data: {
          name: 'Administradora',
          email: 'admin@test.invalid',
          password: 'hash-nao-utilizado',
          isActive: true,
          role: 'ADMIN',
        },
      }),
      db().user.create({
        data: {
          name: 'Usuário comum',
          email: 'common@test.invalid',
          password: 'hash-nao-utilizado',
          isActive: true,
          role: 'COMMON',
        },
      }),
      db().user.create({
        data: {
          name: 'Usuário desativado',
          email: 'inactive@test.invalid',
          password: 'hash-nao-utilizado',
          isActive: false,
          role: 'COMMON',
        },
      }),
    ]);
    adminId = admin.id;
    commonId = common.id;
    inactiveId = inactive.id;
    const jwt = new JwtService({ secret: process.env.JWT_SECRET });
    adminToken = jwt.sign({ sub: admin.id, role: 'ADMIN' });
    commonToken = jwt.sign({ sub: common.id, role: 'COMMON' });
  });

  it('lists active and inactive users with search, status filtering and pagination', async () => {
    const page = await get('/users?page=1&pageSize=2').expect(200);
    expect(page.body).toMatchObject({ total: 3, page: 1, pageSize: 2 });
    expect(page.body.data).toHaveLength(2);
    expect(page.body.data[0]).not.toHaveProperty('password');

    const allUsers = await get('/users?pageSize=20').expect(200);
    expect(allUsers.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'ADMIN', isActive: true }),
      ]),
    );

    const inactive = await get('/users?status=INACTIVE').expect(200);
    expect(inactive.body).toMatchObject({ total: 1 });
    expect(inactive.body.data[0]).toMatchObject({
      id: inactiveId,
      name: 'Usuário desativado',
      isActive: false,
    });

    const search = await get('/users?search=common@test.invalid').expect(200);
    expect(search.body.total).toBe(1);
    expect(search.body.data[0].id).toBe(commonId);
  });

  it('rejects user listing and mutations from non-administrators', async () => {
    await get('/users', commonToken).expect(403);
    await patch(
      `/users/${inactiveId}/status`,
      { isActive: true },
      commonToken,
    ).expect(403);
    await patch(
      `/users/${inactiveId}/role`,
      { role: 'ADMIN' },
      commonToken,
    ).expect(403);
    await remove(`/users/${commonId}`, commonToken).expect(403);
  });

  it('allows administrators to promote and demote users through the API', async () => {
    await patch(`/users/${commonId}/role`, { role: 'ADMIN' })
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({ id: commonId, role: 'ADMIN' }),
      );
    expect(
      (await db().user.findUniqueOrThrow({ where: { id: commonId } })).role,
    ).toBe('ADMIN');

    await patch(`/users/${commonId}/role`, { role: 'COMMON' })
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({ id: commonId, role: 'COMMON' }),
      );
    await patch(`/users/${commonId}/role`, { role: 'OWNER' }).expect(400);
    await patch(`/users/${adminId}/role`, { role: 'COMMON' }).expect(409);
  });

  it('activates and deactivates accounts through a validated status endpoint', async () => {
    await patch(`/users/${inactiveId}/status`, { isActive: true })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ id: inactiveId, isActive: true });
      });
    expect(
      (await db().user.findUniqueOrThrow({ where: { id: inactiveId } }))
        .isActive,
    ).toBe(true);

    await patch(`/users/${commonId}/status`, { isActive: false })
      .expect(200)
      .expect(({ body }) => expect(body.isActive).toBe(false));
    expect(
      (await db().user.findUniqueOrThrow({ where: { id: commonId } })).isActive,
    ).toBe(false);
    await patch(`/users/${inactiveId}/status`, { isActive: 'yes' }).expect(400);
  });

  it('soft-deletes users and prevents an administrator from locking out themselves', async () => {
    await remove(`/users/${commonId}`).expect(204);
    const removed = await db().user.findUniqueOrThrow({
      where: { id: commonId },
    });
    expect(removed.deletedAt).toBeInstanceOf(Date);
    expect((await get('/users').expect(200)).body.total).toBe(2);

    await patch(`/users/${adminId}/status`, { isActive: false }).expect(409);
    await remove(`/users/${adminId}`).expect(409);
    expect(
      (await db().user.findUniqueOrThrow({ where: { id: adminId } })).isActive,
    ).toBe(true);
  });
});
