import { SupplyService } from './supply.service';
import { SupplyRepository } from '../supply.repository';
import { DatabaseService } from '../../database/database.service';

describe('SupplyService', () => {
  it('keeps an omitted balance out of Prisma create input and only writes catalog fields on update', async () => {
    const record = {
      id: 'a',
      name: 'Arroz',
      description: null,
      unit: 'UNIT',
      currentQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const repository = {
      create: jest.fn().mockResolvedValue(record),
      update: jest.fn().mockResolvedValue(record),
    };
    const service = new SupplyService(
      {} as DatabaseService,
      repository as unknown as SupplyRepository,
    );
    await service.create({ name: 'Arroz', unit: 'UNIT' });
    expect(repository.create.mock.calls[0][0]).not.toHaveProperty(
      'currentQuantity',
    );
    await service.create({
      name: 'Arroz',
      unit: 'UNIT',
      currentQuantity: 15,
    });
    expect(repository.create.mock.calls[1][0].currentQuantity).toBe(15);
    await service.update('a', { name: 'Outro' });
    expect(repository.update.mock.calls[0][1]).not.toHaveProperty(
      'currentQuantity',
    );
  });
});
