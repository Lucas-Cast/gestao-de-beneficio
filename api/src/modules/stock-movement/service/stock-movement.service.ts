import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { MAX_INTEGER_VALUE } from '../../../common/domain/integer-limits';
import { withHttpErrors } from '../../../common/errors/to-http-exception';
import { DatabaseService } from '../../database/database.service';
import { SupplyService } from '../../supply/service/supply.service';
import { StockMovementRepository } from '../stock-movement.repository';
import { StockMovementDomain } from '../domain/stock-movement.domain';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { ListStockMovementsDto } from '../dto/list-stock-movements.dto';
import { UserService } from '../../user/service/user.service';
import { SupplyDomain } from '../../supply/domain/supply.domain';
import { UserDomain } from '../../user/domain/user.domain';

export type StockMovementWithRelations = Prisma.StockMovementGetPayload<{
  include: { supply: true; performedBy: true };
}>;

@Injectable()
export class StockMovementService {
  constructor(
    private readonly database: DatabaseService,
    private readonly repository: StockMovementRepository,
    private readonly supplies: SupplyService,
    private readonly users: UserService,
  ) {}

  create(dto: CreateStockMovementDto, actorId: string) {
    return withHttpErrors(() =>
      this.database.$transaction(async (tx) => {
        if (!(await this.users.isActive(tx, actorId)))
          throw new DomainError('INACTIVE_USER');
        return this.record(tx, dto, actorId);
      }),
    );
  }

  /** Internal operation: the caller must pass its transaction and validated actor. */
  async record(
    tx: Prisma.TransactionClient,
    dto: CreateStockMovementDto,
    actorId: string,
    deliveryId?: string,
  ) {
    const quantity = dto.quantity;
    const supply = await this.supplies.findByIdInTransaction(
      tx,
      dto.supplyId,
    );
    if (!supply) throw new DomainError('SUPPLY_NOT_FOUND');
    StockMovementDomain.balanceAfter(
      supply.currentQuantity,
      dto.type,
      quantity,
    );
    const result = await this.supplies.changeBalanceInTransaction(
      tx,
      dto.supplyId,
      dto.type,
      quantity,
      MAX_INTEGER_VALUE - quantity,
    );
    if (result.count !== 1) {
      throw new DomainError(
        dto.type === 'OUT' ? 'INSUFFICIENT_STOCK' : 'QUANTITY_OVERFLOW',
      );
    }
    return this.toResponse(
      await this.repository.create(tx, {
        supplyId: dto.supplyId,
        type: dto.type,
        quantity,
        reason: dto.reason,
        performedById: actorId,
        basketDeliveryId: deliveryId,
      }),
    );
  }

  findAll(query: ListStockMovementsDto) {
    return withHttpErrors(async () => {
      if (query.from && query.to && query.from > query.to)
        throw new DomainError('INVALID_DATE_RANGE');
      const { data, total } = await this.repository.findAll(query);
      return {
        data: data.map((movement) => this.toResponse(movement)),
        total,
        page: query.page,
        pageSize: query.pageSize,
      };
    });
  }

  toResponse(movement: StockMovementWithRelations) {
    const { supplyId: _supplyId, performedById: _performedById, ...fields } =
      StockMovementDomain.fromPrisma(movement);
    return {
      ...fields,
      supply: SupplyDomain.fromPrisma(movement.supply),
      performedBy: UserDomain.fromPrisma(movement.performedBy),
    };
  }
}
