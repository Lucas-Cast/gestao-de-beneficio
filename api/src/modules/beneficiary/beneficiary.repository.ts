import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { DatabaseService } from '../database/database.service';
import { ListBeneficiariesDto } from './dto/list-beneficiaries.dto';
import { paginate } from '../../common/pagination/paginate';

@Injectable()
export class BeneficiaryRepository {
  constructor(private readonly database: DatabaseService) {}

  create(tx: Prisma.TransactionClient, data: Prisma.BeneficiaryCreateInput) {
    return tx.beneficiary.create({ data, include: { address: true } });
  }

  findById(id: string, tx: Prisma.TransactionClient = this.database) {
    return tx.beneficiary.findFirst({
      where: { id, deletedAt: null },
      include: { address: true },
    });
  }

  findAll(query: ListBeneficiariesDto) {
    const where: Prisma.BeneficiaryWhereInput = {
      deletedAt: null,
      cpf: query.cpf,
      name: query.search
        ? { contains: query.search, mode: 'insensitive' }
        : undefined,
    };
    return paginate(
      query,
      ({ skip, take }) =>
        this.database.beneficiary.findMany({
          where,
          include: { address: true },
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
      () => this.database.beneficiary.count({ where }),
    );
  }

  findDeleted(query: ListBeneficiariesDto) {
    const where: Prisma.BeneficiaryWhereInput = {
      deletedAt: { not: null },
      cpf: query.cpf,
      name: query.search
        ? { contains: query.search, mode: 'insensitive' }
        : undefined,
    };
    return paginate(
      query,
      ({ skip, take }) =>
        this.database.beneficiary.findMany({
          where,
          include: { address: true },
          skip,
          take,
          orderBy: [{ deletedAt: 'desc' }, { id: 'desc' }],
        }),
      () => this.database.beneficiary.count({ where }),
    );
  }

  findDeletedById(id: string, tx: Prisma.TransactionClient) {
    return tx.beneficiary.findFirst({
      where: { id, deletedAt: { not: null } },
      include: { address: true },
    });
  }

  restore(tx: Prisma.TransactionClient, id: string) {
    return tx.beneficiary.update({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null },
      include: { address: true },
    });
  }

  async update(
    tx: Prisma.TransactionClient,
    id: string,
    data: Prisma.BeneficiaryUpdateInput,
  ) {
    return tx.beneficiary.update({
      where: { id, deletedAt: null },
      data,
      include: { address: true },
    });
  }

  softDelete(tx: Prisma.TransactionClient, id: string) {
    return tx.beneficiary.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
      include: { address: true },
    });
  }
}
