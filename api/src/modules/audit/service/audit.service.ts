import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { UserService } from '../../user/service/user.service';
import { AuditRepository } from '../audit.repository';
import { AuditDomain, AuditEntity } from '../domain/audit.domain';

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
}
