import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class AuditRepository {
  async create(
    tx: Prisma.TransactionClient,
    data: Prisma.AuditLogUncheckedCreateInput,
  ) {
    return tx.auditLog.create({ data });
  }
}
