import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { DatabaseService } from '../database/database.service';
import { ListSuppliesDto } from './dto/list-supplies.dto';
import { paginate } from '../../common/pagination/paginate';

@Injectable()
export class SupplyRepository {
  constructor(private readonly database: DatabaseService) {}

  create(data: Prisma.SupplyCreateInput) {
    return this.database.supply.create({ data });
  }

  findAll(query: ListSuppliesDto) {
    const where: Prisma.SupplyWhereInput = {
      deletedAt: null,
      unit: query.unit,
      name: query.search
        ? { contains: query.search, mode: 'insensitive' }
        : undefined,
    };
    return paginate(
      query,
      ({ skip, take }) =>
        this.database.supply.findMany({
          where,
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
      () => this.database.supply.count({ where }),
    );
  }

  findById(id: string, tx: Prisma.TransactionClient = this.database) {
    return tx.supply.findFirst({ where: { id, deletedAt: null } });
  }

  findActiveByIds(tx: Prisma.TransactionClient, ids: string[]) {
    return tx.supply.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true },
    });
  }

  update(id: string, data: Prisma.SupplyUpdateInput) {
    return this.database.supply.update({
      where: { id, deletedAt: null },
      data,
    });
  }

  softDelete(tx: Prisma.TransactionClient, id: string) {
    return tx.supply.updateMany({
      where: {
        id,
        deletedAt: null,
        basketItems: {
          none: {
            deletedAt: null,
            basket: { is: { deletedAt: null } },
          },
        },
      },
      data: { deletedAt: new Date() },
    });
  }

  changeBalance(
    tx: Prisma.TransactionClient,
    id: string,
    type: 'IN' | 'OUT',
    quantity: number,
    maximumBeforeEntry: number,
  ): Promise<Prisma.BatchPayload> {
    return tx.supply.updateMany({
      where: {
        id,
        deletedAt: null,
        currentQuantity:
          type === 'OUT' ? { gte: quantity } : { lte: maximumBeforeEntry },
      },
      data: {
        currentQuantity:
          type === 'OUT' ? { decrement: quantity } : { increment: quantity },
      },
    });
  }
}
