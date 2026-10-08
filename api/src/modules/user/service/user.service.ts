import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import type { UserRole } from '../../../generated/prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { withHttpErrors } from '../../../common/errors/to-http-exception';
import { DatabaseService } from '../../database/database.service';
import { UserDomain } from '../domain/user.domain';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { ListUsersDto } from '../dto/list-users.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UserRepository } from '../user.repository';
import { HashService } from './hash.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    private readonly database: DatabaseService,
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDomain> {
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('E-mail já está em uso.');
    }

    const user = await this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: await this.hashService.hash(createUserDto.password),
      isActive: false,
    });

    return UserDomain.fromPrisma(user);
  }

  async login(loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(loginUserDto.email);
    const valid = user
      ? await this.hashService.compare(loginUserDto.password, user.password)
      : false;

    if (!user || user.deletedAt !== null || !user.isActive || !valid) {
      throw new UnauthorizedException('E-mail ou senha invalidos.');
    }

    return this.createAuthResponse(user);
  }

  async findAll(query: ListUsersDto) {
    const { data, total } = await this.userRepository.findAll(query);
    return {
      data: UserDomain.fromPrismaMany(data),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async isActive(tx: Prisma.TransactionClient, id: string): Promise<boolean> {
    return Boolean(await this.userRepository.findActiveById(tx, id));
  }

  async findOne(id: string): Promise<UserDomain> {
    const user = await this.findActiveUser(id);
    return UserDomain.fromPrisma(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDomain> {
    const currentUser = await this.findActiveUser(id);

    if (updateUserDto.email && updateUserDto.email !== currentUser.email) {
      const userWithEmail = await this.userRepository.findByEmail(
        updateUserDto.email,
      );

      if (userWithEmail) {
        throw new ConflictException('E-mail já está em uso.');
      }
    }

    const data: Prisma.UserUpdateInput = {};

    if (updateUserDto.name) {
      data.name = updateUserDto.name;
    }

    if (updateUserDto.email) {
      data.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      data.password = await this.hashService.hash(updateUserDto.password);
    }

    const user = await this.userRepository.update(id, data);
    return UserDomain.fromPrisma(user);
  }

  setActive(id: string, isActive: boolean, actorId: string) {
    return withHttpErrors(() =>
      this.database.$transaction(
        async (tx) => {
          const user = await this.userRepository.findById(id, tx);
          if (!user) throw new DomainError('USER_NOT_FOUND');
          if (id === actorId && !isActive)
            throw new DomainError('CANNOT_MANAGE_SELF');

          if (
            !isActive &&
            user.isActive &&
            user.role === 'ADMIN' &&
            (await this.userRepository.countActiveAdmins(tx)) <= 1
          ) {
            throw new DomainError('LAST_ACTIVE_ADMIN');
          }

          return UserDomain.fromPrisma(
            await this.userRepository.setActive(tx, id, isActive),
          );
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }

  setRole(
    id: string,
    role: UpdateUserRoleDto['role'],
    actorId: string,
  ): Promise<UserDomain> {
    return withHttpErrors(() =>
      this.database.$transaction(
        async (tx) => {
          const user = await this.userRepository.findById(id, tx);
          if (!user) throw new DomainError('USER_NOT_FOUND');
          if (user.role === role) return UserDomain.fromPrisma(user);
          if (id === actorId) throw new DomainError('CANNOT_CHANGE_OWN_ROLE');

          if (
            user.isActive &&
            user.role === 'ADMIN' &&
            role === 'COMMON' &&
            (await this.userRepository.countActiveAdmins(tx)) <= 1
          ) {
            throw new DomainError('LAST_ACTIVE_ADMIN');
          }

          return UserDomain.fromPrisma(
            await this.userRepository.setRole(tx, id, role),
          );
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }

  remove(id: string, actorId: string): Promise<void> {
    return withHttpErrors(() =>
      this.database.$transaction(
        async (tx) => {
          const user = await this.userRepository.findById(id, tx);
          if (!user) throw new DomainError('USER_NOT_FOUND');
          if (id === actorId) throw new DomainError('CANNOT_MANAGE_SELF');

          if (
            user.isActive &&
            user.role === 'ADMIN' &&
            (await this.userRepository.countActiveAdmins(tx)) <= 1
          ) {
            throw new DomainError('LAST_ACTIVE_ADMIN');
          }

          await this.userRepository.softDelete(tx, id);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }

  private createAuthResponse(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }): LoginResponseDto {
    return {
      token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private async findActiveUser(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }
}
