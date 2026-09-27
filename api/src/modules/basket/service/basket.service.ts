import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { withHttpErrors } from '../../../common/errors/to-http-exception';
import { DatabaseService } from '../../database/database.service';
import { AuditService } from '../../audit/service/audit.service';
import { SupplyService } from '../../supply/service/supply.service';
import { BasketRepository } from '../basket.repository';
import { BasketDomain } from '../domain/basket.domain';
import { CreateBasketDto } from '../dto/create-basket.dto';
import { ListBasketsDto } from '../dto/list-baskets.dto';

@Injectable()
export class BasketService {
  constructor(
    private readonly database: DatabaseService,
    private readonly repository: BasketRepository,
    private readonly supplies: SupplyService,
    private readonly audit: AuditService,
  ) {}

  async findByIdInTransaction(tx: Prisma.TransactionClient, id: string) {
    const record = await this.repository.findById(id, tx);
    return record ? BasketDomain.fromPrisma(record) : null;
  }

  create(dto: CreateBasketDto, actorId: string) {
    return withHttpErrors(() =>
      this.database.$transaction(
        async (tx) => {
          BasketDomain.validateComposition(dto.supplies);
          await this.supplies.assertActiveInTransaction(
            tx,
            dto.supplies.map((item) => item.supplyId),
          );
          const basket = BasketDomain.fromPrisma(
            await this.repository.create(tx, {
              name: dto.name,
              description: dto.description,
              supplies: {
                create: dto.supplies.map((item) => ({
                  supplyId: item.supplyId,
                  quantity: item.quantity,
                })),
              },
            }),
          );
          await this.audit.record(
            tx,
            'BASKET',
            basket.id,
            null,
            basket.auditSnapshot(),
            actorId,
          );
          return basket;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }

  findAll(query: ListBasketsDto) {
    return withHttpErrors(async () => {
      const { data, total } = await this.repository.findAll(query);
      return {
        data: BasketDomain.fromPrismaMany(data),
        total,
        page: query.page,
        pageSize: query.pageSize,
      };
    });
  }

  findOne(id: string) {
    return withHttpErrors(async () => {
      const record = await this.repository.findById(id);
      if (!record) throw new DomainError('BASKET_NOT_FOUND');
      return BasketDomain.fromPrisma(record);
    });
  }

  remove(id: string, actorId: string) {
    return withHttpErrors(() =>
      this.database.$transaction(
        async (tx) => {
          const before = await this.findByIdInTransaction(tx, id);
          if (!before) throw new DomainError('BASKET_NOT_FOUND');
          const after = BasketDomain.fromPrisma(
            await this.repository.softDelete(tx, id),
          );
          await this.audit.record(
            tx,
            'BASKET',
            id,
            before.auditSnapshot(),
            after.auditSnapshot(),
            actorId,
          );
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }
}
