import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { DatabaseService } from '../database/database.service';
import { ListStockMovementsDto } from './dto/list-stock-movements.dto';

const movementRelations = { supply: true, performedBy: true } satisfies
  Prisma.StockMovementInclude;

@Injectable()
export class StockMovementRepository {
  constructor(private readonly database: DatabaseService) {}

  create(
    tx: Prisma.TransactionClient,
    data: Prisma.StockMovementUncheckedCreateInput,
  ) {
    return tx.stockMovement.create({ data, include: movementRelations });
  }

  async findAll(query: ListStockMovementsDto) {
    const where: Prisma.StockMovementWhereInput = {
      deletedAt: null,
      supplyId: query.supplyId,
      performedById: query.performedById,
      type: query.type,
      basketDeliveryId: query.basketDeliveryId,
      createdAt: { gte: query.from, lte: query.to },
    };
    const [data, total] = await Promise.all([
      this.database.stockMovement.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: movementRelations,
      }),
      this.database.stockMovement.count({ where }),
    ]);
    return { data, total };
  }
}
