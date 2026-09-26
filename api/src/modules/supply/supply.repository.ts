import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { DatabaseService } from '../database/database.service';
import { ListSuppliesDto } from './dto/list-supplies.dto';

@Injectable()
export class SupplyRepository {
  constructor(private readonly database: DatabaseService) {}

  create(data: Prisma.SupplyCreateInput) {
    return this.database.supply.create({ data });
  }

  async findAll(query: ListSuppliesDto) {
    const where: Prisma.SupplyWhereInput = {
      deletedAt: null,
      unit: query.unit,
      name: query.search
        ? { contains: query.search, mode: 'insensitive' }
        : undefined,
    };
    const [data, total] = await Promise.all([
      this.database.supply.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.database.supply.count({ where }),
    ]);
    return { data, total };
  }

  findById(id: string, tx: Prisma.TransactionClient = this.database) {
    return tx.supply.findFirst({ where: { id, deletedAt: null } });
  }

  update(id: string, data: Prisma.SupplyUpdateInput) {
    return this.database.supply.update({
      where: { id, deletedAt: null },
      data,
    });
  }

  softDelete(id: string) {
    return this.database.supply.update({
      where: { id, deletedAt: null },
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
