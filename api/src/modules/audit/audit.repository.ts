import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { paginate } from '../../common/pagination/paginate';
import { DatabaseService } from '../database/database.service';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';

@Injectable()
export class AuditRepository {
  constructor(private readonly database: DatabaseService) {}

  async create(
    tx: Prisma.TransactionClient,
    data: Prisma.AuditLogUncheckedCreateInput,
  ) {
    return tx.auditLog.create({ data });
  }

  findAll(query: ListAuditLogsDto) {
    const where: Prisma.AuditLogWhereInput = {
      entityType: query.entityType,
      entityId: query.entityId,
      changedById: query.changedById,
      createdAt: { gte: query.from, lte: query.to },
    };
    return paginate(
      query,
      ({ skip, take }) =>
        this.database.auditLog.findMany({
          where,
          skip,
          take,
          include: { changedBy: true },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
      () => this.database.auditLog.count({ where }),
    );
  }
}
