import { DatabaseService } from '../database/database.service';
import { AuditRepository } from './audit.repository';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';

describe('AuditRepository.findAll', () => {
  it('applies filters and pagination to rows and total equally', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(3);
    const repository = new AuditRepository({
      auditLog: { findMany, count },
    } as unknown as DatabaseService);
    const query = Object.assign(new ListAuditLogsDto(), {
      entityType: 'BASKET',
      entityId: 'basket-1',
      changedById: 'user-1',
      from: new Date('2026-09-01T00:00:00.000Z'),
      to: new Date('2026-10-01T00:00:00.000Z'),
      page: 2,
      pageSize: 1,
    });

    const result = await repository.findAll(query);
    const where = {
      entityType: 'BASKET',
      entityId: 'basket-1',
      changedById: 'user-1',
      createdAt: { gte: query.from, lte: query.to },
    };
    expect(findMany).toHaveBeenCalledWith({
      where,
      skip: 1,
      take: 1,
      include: { changedBy: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    expect(count).toHaveBeenCalledWith({ where });
    expect(result).toEqual({ data: [], total: 3 });
  });
});
