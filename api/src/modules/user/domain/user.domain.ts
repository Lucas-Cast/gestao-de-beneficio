import { ApiProperty } from '@nestjs/swagger';
import type { User as PrismaUser } from '../../../generated/prisma/client';

type UserProps = Pick<
  PrismaUser,
  'id' | 'name' | 'email' | 'isDeleted' | 'isActive' | 'createdAt' | 'updatedAt'
>;

export class UserDomain {
  @ApiProperty({ format: 'uuid' })
  readonly id: string;

  @ApiProperty({ example: 'Ana Souza' })
  readonly name: string;

  @ApiProperty({ example: 'usuario@exemplo.com' })
  readonly email: string;

  @ApiProperty({ example: false })
  readonly isDeleted: boolean;

  @ApiProperty({ example: false })
  readonly isActive: boolean;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  private constructor(user: UserProps) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.isDeleted = user.isDeleted;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  static fromPrisma(user: PrismaUser): UserDomain {
    return new UserDomain(user);
  }

  static fromPrismaMany(users: PrismaUser[]): UserDomain[] {
    return users.map((user) => UserDomain.fromPrisma(user));
  }
}
