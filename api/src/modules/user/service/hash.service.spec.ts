import { HashService } from './hash.service';

describe('HashService', () => {
  const service = new HashService();

  it('creates a salted hash without exposing the original value', async () => {
    const value = 'senha-segura-123';
    const hash = await service.hash(value);

    expect(hash).not.toBe(value);
    expect(hash).toContain(':');
  });
});
