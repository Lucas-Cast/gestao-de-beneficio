import { Injectable } from '@nestjs/common';
import type { Prisma, User as PrismaUser } from '../../generated/prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: Prisma.UserCreateInput): Promise<PrismaUser> {
    return this.databaseService.user.create({ data });
  }

  async findAll(): Promise<PrismaUser[]> {
    return this.databaseService.user.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<PrismaUser | null> {
    return this.databaseService.user.findFirst({
      where: { id, isDeleted: false },
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

  async softDelete(id: string): Promise<PrismaUser> {
    return this.databaseService.user.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
