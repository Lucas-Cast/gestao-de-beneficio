import { AuditRepository } from '../audit.repository';
import { ListAuditLogsDto } from '../dto/list-audit-logs.dto';
import { UserService } from '../../user/service/user.service';
import { AuditService } from './audit.service';

jest.mock('../../user/service/user.service', () => ({
  UserService: class {},
}));

describe('AuditService.findAll', () => {
  const findAll = jest.fn();
  const service = new AuditService(
    { findAll } as unknown as AuditRepository,
    {} as UserService,
  );

  beforeEach(() => findAll.mockReset());

  it('returns paginated changes with a safe actor profile', async () => {
    findAll.mockResolvedValue({
      total: 1,
      data: [
        {
          id: 'audit-1',
          entityType: 'BENEFICIARY',
          entityId: 'beneficiary-1',
          changedById: 'user-1',
          from: { name: 'Ana' },
          to: { name: 'Ana Souza' },
          createdAt: new Date('2026-09-26T12:00:00.000Z'),
          updatedAt: new Date('2026-09-26T12:00:00.000Z'),
          changedBy: {
            id: 'user-1',
            name: 'Operador',
            email: 'operator@test.invalid',
            password: 'never-return-this',
            role: 'COMMON',
            isActive: true,
            deletedAt: null,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        },
      ],
    });

    const query = Object.assign(new ListAuditLogsDto(), {
      entityType: 'BENEFICIARY',
    });
    const result = await service.findAll(query);

    expect(findAll).toHaveBeenCalledWith(query);
    expect(result).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 20,
      data: [
        {
          from: { name: 'Ana' },
          to: { name: 'Ana Souza' },
          changedBy: { id: 'user-1', name: 'Operador' },
        },
      ],
    });
    expect(result.data[0]).not.toHaveProperty('changedById');
    expect(result.data[0].changedBy).not.toHaveProperty('password');
  });

  it('rejects reversed date ranges before reading the database', async () => {
    const query = Object.assign(new ListAuditLogsDto(), {
      from: new Date('2026-10-01T00:00:00.000Z'),
      to: new Date('2026-09-01T00:00:00.000Z'),
    });
    await expect(service.findAll(query)).rejects.toMatchObject({
      status: 400,
    });
    expect(findAll).not.toHaveBeenCalled();
  });
});
