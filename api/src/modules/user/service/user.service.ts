import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { UserDomain } from '../domain/user.domain';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UserRepository } from '../user.repository';
import { HashService } from './hash.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<LoginResponseDto> {
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
    });

    return this.createAuthResponse(user);
  }

  async login(loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(loginUserDto.email);
    const valid = user
      ? await this.hashService.compare(loginUserDto.password, user.password)
      : false;

    if (!user || user.isDeleted || !valid) {
      throw new UnauthorizedException('E-mail ou senha invalidos.');
    }

    return this.createAuthResponse(user);
  }

  async findAll(): Promise<UserDomain[]> {
    const users = await this.userRepository.findAll();
    return UserDomain.fromPrismaMany(users);
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

  async remove(id: string): Promise<void> {
    await this.findActiveUser(id);
    await this.userRepository.softDelete(id);
  }

  private createAuthResponse(user: {
    id: string;
    name: string;
    email: string;
  }): LoginResponseDto {
    return {
      token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        name: user.name,
      }),
      name: user.name,
      email: user.email,
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
