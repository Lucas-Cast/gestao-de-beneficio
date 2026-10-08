import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../../../generated/prisma/client';
import type { User as PrismaUser } from '../../../generated/prisma/client';
import { DatabaseService } from '../../database/database.service';
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
  deletedAt: null,
  isActive: true,
  role: 'COMMON',
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
  const transactionClient = {} as Prisma.TransactionClient;
  const database = {
    $transaction: jest.fn(
      (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
        operation(transactionClient),
    ),
  };
  const userRepository = {
    create: jest.fn<Promise<PrismaUser>, [Prisma.UserCreateInput]>(),
    findAll: jest.fn<
      Promise<{ data: PrismaUser[]; total: number }>,
      [import('../dto/list-users.dto').ListUsersDto]
    >(),
    findByEmail: jest.fn<Promise<PrismaUser | null>, [string]>(),
    findById: jest.fn<
      Promise<PrismaUser | null>,
      [string, Prisma.TransactionClient?]
    >(),
    update: jest.fn<Promise<PrismaUser>, [string, Prisma.UserUpdateInput]>(),
    softDelete: jest.fn<
      Promise<PrismaUser>,
      [Prisma.TransactionClient, string]
    >(),
    setActive: jest.fn<
      Promise<PrismaUser>,
      [Prisma.TransactionClient, string, boolean]
    >(),
    setRole: jest.fn<
      Promise<PrismaUser>,
      [Prisma.TransactionClient, string, PrismaUser['role']]
    >(),
    countActiveAdmins: jest.fn<Promise<number>, [Prisma.TransactionClient]>(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    database.$transaction.mockImplementation((operation) =>
      operation(transactionClient),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: DatabaseService, useValue: database },
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
    userRepository.create.mockResolvedValue({
      ...prismaUser,
      isActive: false,
    });
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
    expect(createdUser.isActive).toBe(false);
    expect(createdUser).not.toHaveProperty('role');
    expect(user).toEqual({
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      deletedAt: null,
      isActive: false,
      role: 'COMMON',
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
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

  it.each(['COMMON', 'ADMIN'] as const)(
    'includes the %s role in the JWT when authenticating',
    async (role) => {
      userRepository.findByEmail.mockResolvedValue({ ...prismaUser, role });
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
        role,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: prismaUser.id,
        email: prismaUser.email,
        name: prismaUser.name,
        role,
      });
    },
  );

  it('rejects inactive users even with a valid password', async () => {
    userRepository.findByEmail.mockResolvedValue({
      ...prismaUser,
      isActive: false,
    });
    hashService.compare.mockResolvedValue(true);

    await expect(
      service.login({
        email: prismaUser.email,
        password: 'senha-segura-123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('marks an existing user as deleted instead of deleting it physically', async () => {
    userRepository.findById.mockResolvedValue(prismaUser);
    userRepository.softDelete.mockResolvedValue({
      ...prismaUser,
      deletedAt: new Date('2026-09-13T12:00:00.000Z'),
    });

    await service.remove('another-user-id', 'admin-id');

    expect(userRepository.softDelete).toHaveBeenCalledWith(
      expect.anything(),
      'another-user-id',
    );
  });

  it('returns not found when attempting to remove a deleted or unknown user', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      service.remove(prismaUser.id, 'admin-id'),
    ).rejects.toMatchObject({ status: 404 });
    expect(userRepository.softDelete).not.toHaveBeenCalled();
  });

  it('activates a user and runs the status change in a serializable transaction', async () => {
    userRepository.findById.mockResolvedValue({
      ...prismaUser,
      isActive: false,
    });
    userRepository.setActive.mockResolvedValue({
      ...prismaUser,
      isActive: true,
    });

    await expect(
      service.setActive(prismaUser.id, true, 'admin-id'),
    ).resolves.toMatchObject({ isActive: true, role: 'COMMON' });
    expect(userRepository.setActive).toHaveBeenCalledWith(
      expect.anything(),
      prismaUser.id,
      true,
    );
    expect(database.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('does not allow an administrator to deactivate their own account', async () => {
    userRepository.findById.mockResolvedValue({ ...prismaUser, role: 'ADMIN' });

    await expect(
      service.setActive(prismaUser.id, false, prismaUser.id),
    ).rejects.toMatchObject({ status: 409 });
    expect(userRepository.setActive).not.toHaveBeenCalled();
  });

  it('does not allow removing the last active administrator', async () => {
    userRepository.findById.mockResolvedValue({ ...prismaUser, role: 'ADMIN' });
    userRepository.countActiveAdmins.mockResolvedValue(1);

    await expect(
      service.setActive('another-user-id', false, 'actor-id'),
    ).rejects.toMatchObject({ status: 409 });
    expect(userRepository.setActive).not.toHaveBeenCalled();
  });

  it('changes a user role in a serializable transaction', async () => {
    userRepository.findById.mockResolvedValue(prismaUser);
    userRepository.setRole.mockResolvedValue({ ...prismaUser, role: 'ADMIN' });

    await expect(
      service.setRole(prismaUser.id, 'ADMIN', 'admin-id'),
    ).resolves.toMatchObject({ role: 'ADMIN' });
    expect(userRepository.setRole).toHaveBeenCalledWith(
      expect.anything(),
      prismaUser.id,
      'ADMIN',
    );
    expect(database.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('does not allow changing the signed-in administrator role', async () => {
    userRepository.findById.mockResolvedValue({ ...prismaUser, role: 'ADMIN' });

    await expect(
      service.setRole(prismaUser.id, 'COMMON', prismaUser.id),
    ).rejects.toMatchObject({ status: 409 });
    expect(userRepository.setRole).not.toHaveBeenCalled();
  });

  it('does not allow demoting the last active administrator', async () => {
    userRepository.findById.mockResolvedValue({ ...prismaUser, role: 'ADMIN' });
    userRepository.countActiveAdmins.mockResolvedValue(1);

    await expect(
      service.setRole('another-user-id', 'COMMON', 'actor-id'),
    ).rejects.toMatchObject({ status: 409 });
    expect(userRepository.setRole).not.toHaveBeenCalled();
  });

  it('does not write when the requested role is already assigned', async () => {
    userRepository.findById.mockResolvedValue(prismaUser);

    await expect(
      service.setRole(prismaUser.id, 'COMMON', 'actor-id'),
    ).resolves.toMatchObject({ role: 'COMMON' });
    expect(userRepository.setRole).not.toHaveBeenCalled();
  });
});
