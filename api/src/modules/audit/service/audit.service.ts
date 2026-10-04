import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { withHttpErrors } from '../../../common/errors/to-http-exception';
import { UserService } from '../../user/service/user.service';
import { UserDomain } from '../../user/domain/user.domain';
import { AuditRepository } from '../audit.repository';
import { AuditDomain, AuditEntity } from '../domain/audit.domain';
import { ListAuditLogsDto } from '../dto/list-audit-logs.dto';

@Injectable()
export class AuditService {
  constructor(
    private readonly repository: AuditRepository,
    private readonly users: UserService,
  ) {}

  /** Participates in the caller's transaction; it never starts an independent write. */
  async record(
    tx: Prisma.TransactionClient,
    entityType: AuditEntity,
    entityId: string,
    before: object | null,
    after: object,
    actorId: string,
  ) {
    if (!(await this.users.isActive(tx, actorId)))
      throw new DomainError('INACTIVE_USER');
    const changes = AuditDomain.changes(before, after);
    return AuditDomain.fromPrisma(
      await this.repository.create(tx, {
        entityType,
        entityId,
        changedById: actorId,
        from: changes.from ?? Prisma.DbNull,
        to: changes.to,
      }),
    );
  }

  findAll(query: ListAuditLogsDto) {
    return withHttpErrors(async () => {
      if (query.from && query.to && query.from > query.to)
        throw new DomainError('INVALID_DATE_RANGE');
      const { data, total } = await this.repository.findAll(query);
      return {
        data: data.map((record) => {
          const audit = AuditDomain.fromPrisma(record).record;
          return {
            id: audit.id,
            entityType: audit.entityType,
            entityId: audit.entityId,
            from: audit.from,
            to: audit.to,
            createdAt: audit.createdAt,
            updatedAt: audit.updatedAt,
            changedBy: UserDomain.fromPrisma(record.changedBy),
          };
        }),
        total,
        page: query.page,
        pageSize: query.pageSize,
      };
    });
  }
}
