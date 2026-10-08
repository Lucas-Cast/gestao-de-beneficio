import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { paginate } from '../../common/pagination/paginate';
import { DatabaseService } from '../database/database.service';
import { ListBasketDeliveriesDto } from './dto/list-basket-deliveries.dto';

const basketDeliveryHistoryRelations = {
  beneficiary: { include: { address: true } },
  basket: {
    include: {
      supplies: {
        include: { supply: true },
        orderBy: { supplyId: 'asc' },
      },
    },
  },
  deliveredBy: true,
  stockMovements: {
    include: { supply: true, performedBy: true },
    orderBy: [{ supplyId: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.BasketDeliveryInclude;

@Injectable()
export class BasketDeliveryRepository {
  constructor(private readonly database: DatabaseService) {}

  getStats(periods: {
    todayStart: Date;
    tomorrowStart: Date;
    monthStart: Date;
    now: Date;
  }) {
    const todayWhere: Prisma.BasketDeliveryWhereInput = {
      deletedAt: null,
      createdAt: { gte: periods.todayStart, lt: periods.tomorrowStart },
    };
    const monthWhere: Prisma.BasketDeliveryWhereInput = {
      deletedAt: null,
      createdAt: { gte: periods.monthStart, lte: periods.now },
    };

    return Promise.all([
      this.database.basketDelivery.aggregate({
        where: todayWhere,
        _sum: { quantity: true },
      }),
      this.database.basketDelivery.groupBy({
        by: ['beneficiaryId'],
        where: todayWhere,
      }),
      this.database.basketDelivery.aggregate({
        where: monthWhere,
        _sum: { quantity: true },
      }),
    ]).then(([today, beneficiaries, month]) => ({
      basketsDeliveredToday: today._sum.quantity ?? 0,
      beneficiariesAttendedToday: beneficiaries.length,
      basketsDeliveredThisMonth: month._sum.quantity ?? 0,
    }));
  }

  create(
    tx: Prisma.TransactionClient,
    data: Prisma.BasketDeliveryUncheckedCreateInput,
  ) {
    return tx.basketDelivery.create({ data });
  }

  findAll(query: ListBasketDeliveriesDto) {
    const search = query.search?.trim();
    const where: Prisma.BasketDeliveryWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              {
                beneficiary: {
                  is: { name: { contains: search, mode: 'insensitive' } },
                },
              },
              {
                basket: {
                  is: { name: { contains: search, mode: 'insensitive' } },
                },
              },
              {
                deliveredBy: {
                  is: { name: { contains: search, mode: 'insensitive' } },
                },
              },
              { observation: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return paginate(
      query,
      ({ skip, take }) =>
        this.database.basketDelivery.findMany({
          where,
          include: basketDeliveryHistoryRelations,
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
      () => this.database.basketDelivery.count({ where }),
    );
  }
}
