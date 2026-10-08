import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const handler = jest.fn();
  const controller = jest.fn();
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  function context(role?: 'ADMIN' | 'COMMON') {
    return {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({
        getRequest: () => (role ? { user: { role } } : { user: undefined }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows access when no role is required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(context('COMMON'))).toBe(true);
  });

  it('allows a user whose role is required', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(guard.canActivate(context('ADMIN'))).toBe(true);
  });

  it('rejects a missing or insufficient role with a safe Portuguese message', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(context('COMMON'))).toThrow(
      new ForbiddenException('Você não tem permissão para realizar esta ação.'),
    );
    expect(() => guard.canActivate(context())).toThrow(ForbiddenException);
  });
});
