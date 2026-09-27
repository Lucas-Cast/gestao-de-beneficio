import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { DatabaseService } from '../database/database.service';
import { ListBasketsDto } from './dto/list-baskets.dto';
import { paginate } from '../../common/pagination/paginate';

const basketRelations = {
  supplies: {
    where: { deletedAt: null },
    include: { supply: true },
    orderBy: { supplyId: 'asc' },
  },
} satisfies Prisma.BasketInclude;

@Injectable()
export class BasketRepository {
  constructor(private readonly database: DatabaseService) {}

  create(tx: Prisma.TransactionClient, data: Prisma.BasketCreateInput) {
    return tx.basket.create({ data, include: basketRelations });
  }

  findById(id: string, tx: Prisma.TransactionClient = this.database) {
    return tx.basket.findFirst({
      where: { id, deletedAt: null },
      include: basketRelations,
    });
  }

  findAll(query: ListBasketsDto) {
    const where: Prisma.BasketWhereInput = {
      deletedAt: null,
      name: query.search
        ? { contains: query.search, mode: 'insensitive' }
        : undefined,
    };
    return paginate(
      query,
      ({ skip, take }) =>
        this.database.basket.findMany({
          where,
          include: basketRelations,
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
      () => this.database.basket.count({ where }),
    );
  }

  softDelete(tx: Prisma.TransactionClient, id: string) {
    const deletedAt = new Date();
    return tx.basket.update({
      where: { id, deletedAt: null },
      data: {
        deletedAt,
        supplies: {
          updateMany: { where: { deletedAt: null }, data: { deletedAt } },
        },
      },
      include: basketRelations,
    });
  }
}
