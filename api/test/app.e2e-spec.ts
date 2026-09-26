import request from 'supertest';
import {
  createIntegrationApp,
  IntegrationApp,
} from './helpers/integration-app';

describe('AppController (e2e)', () => {
  let fixture: IntegrationApp | undefined;
  beforeAll(async () => {
    fixture = await createIntegrationApp();
  });
  afterAll(async () => {
    await fixture?.close();
  });

  it('/ (GET)', () => {
    return request(fixture!.app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
