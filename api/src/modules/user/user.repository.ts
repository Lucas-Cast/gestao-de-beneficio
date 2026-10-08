import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  User as PrismaUser,
  UserRole,
} from '../../generated/prisma/client';
import { DatabaseService } from '../database/database.service';
import { paginate } from '../../common/pagination/paginate';
import { ListUsersDto } from './dto/list-users.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: Prisma.UserCreateInput): Promise<PrismaUser> {
    return this.databaseService.user.create({ data });
  }

  findAll(query: ListUsersDto) {
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      isActive:
        query.status === 'ACTIVE'
          ? true
          : query.status === 'INACTIVE'
            ? false
            : undefined,
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    return paginate(
      query,
      ({ skip, take }) =>
        this.databaseService.user.findMany({
          where,
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
      () => this.databaseService.user.count({ where }),
    );
  }

  findById(
    id: string,
    tx: Prisma.TransactionClient = this.databaseService,
  ): Promise<PrismaUser | null> {
    return tx.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  countActiveAdmins(tx: Prisma.TransactionClient): Promise<number> {
    return tx.user.count({
      where: { deletedAt: null, isActive: true, role: 'ADMIN' },
    });
  }

  setActive(
    tx: Prisma.TransactionClient,
    id: string,
    isActive: boolean,
  ): Promise<PrismaUser> {
    return tx.user.update({
      where: { id, deletedAt: null },
      data: { isActive },
    });
  }

  setRole(
    tx: Prisma.TransactionClient,
    id: string,
    role: UserRole,
  ): Promise<PrismaUser> {
    return tx.user.update({
      where: { id, deletedAt: null },
      data: { role },
    });
  }

  findActiveById(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<PrismaUser | null> {
    return tx.user.findFirst({
      where: { id, deletedAt: null, isActive: true },
    });
  }

  async findByEmail(email: string): Promise<PrismaUser | null> {
    return this.databaseService.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<PrismaUser> {
    return this.databaseService.user.update({
      where: { id },
      data,
    });
  }

  softDelete(tx: Prisma.TransactionClient, id: string): Promise<PrismaUser> {
    return tx.user.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
