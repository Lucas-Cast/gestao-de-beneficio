import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type {
  Prisma,
  User as PrismaUser,
} from '../../../generated/prisma/client';
import { UserRepository } from '../user.repository';
import { HashService } from './hash.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

const prismaUser: PrismaUser = {
  id: '4a6d79f5-0258-4eaf-872c-699287f7b79e',
  name: 'Ana Souza',
  email: 'usuario@exemplo.com',
  password: 'salt:hash',
  isDeleted: false,
  createdAt: new Date('2026-09-13T12:00:00.000Z'),
  updatedAt: new Date('2026-09-13T12:00:00.000Z'),
};

describe('UserService', () => {
  let service: UserService;
  const hashService = {
    hash: jest.fn<Promise<string>, [string]>(),
    compare: jest.fn<Promise<boolean>, [string, string]>(),
  };
  const jwtService = {
    sign: jest.fn<string, [PrismaUser]>().mockReturnValue('jwt-token'),
  };
  const userRepository = {
    create: jest.fn<Promise<PrismaUser>, [Prisma.UserCreateInput]>(),
    findAll: jest.fn<Promise<PrismaUser[]>, []>(),
    findByEmail: jest.fn<Promise<PrismaUser | null>, [string]>(),
    findById: jest.fn<Promise<PrismaUser | null>, [string]>(),
    update: jest.fn<Promise<PrismaUser>, [string, Prisma.UserUpdateInput]>(),
    softDelete: jest.fn<Promise<PrismaUser>, [string]>(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: userRepository,
        },
        {
          provide: HashService,
          useValue: hashService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('hashes the password and never exposes it when creating a user', async () => {
    hashService.hash.mockResolvedValue('salt:hashed-password');
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue(prismaUser);
    jwtService.sign.mockReturnValue('jwt-token');

    const user = await service.create({
      name: prismaUser.name,
      email: prismaUser.email,
      password: 'senha-segura-123',
    });

    const [createdUser] = userRepository.create.mock.calls[0];

    expect(hashService.hash).toHaveBeenCalledWith('senha-segura-123');
    expect(createdUser.name).toBe(prismaUser.name);
    expect(createdUser.email).toBe(prismaUser.email);
    expect(createdUser.password).toBe('salt:hashed-password');
    expect(user).toEqual({
      token: 'jwt-token',
      name: prismaUser.name,
      email: prismaUser.email,
    });
  });

  it('rejects an e-mail that is already in use', async () => {
    userRepository.findByEmail.mockResolvedValue(prismaUser);

    await expect(
      service.create({
        name: prismaUser.name,
        email: prismaUser.email,
        password: 'senha-segura-123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns a JWT and public user data when authenticating', async () => {
    userRepository.findByEmail.mockResolvedValue(prismaUser);
    hashService.compare.mockResolvedValue(true);
    jwtService.sign.mockReturnValue('jwt-token');

    await expect(
      service.login({
        email: prismaUser.email,
        password: 'senha-segura-123',
      }),
    ).resolves.toEqual({
      token: 'jwt-token',
      name: prismaUser.name,
      email: prismaUser.email,
    });
  });

  it('marks an existing user as deleted instead of deleting it physically', async () => {
    userRepository.findById.mockResolvedValue(prismaUser);
    userRepository.softDelete.mockResolvedValue({
      ...prismaUser,
      isDeleted: true,
    });

    await service.remove(prismaUser.id);

    expect(userRepository.softDelete).toHaveBeenCalledWith(prismaUser.id);
  });

  it('returns not found when attempting to remove a deleted or unknown user', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(service.remove(prismaUser.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(userRepository.softDelete).not.toHaveBeenCalled();
  });
});
