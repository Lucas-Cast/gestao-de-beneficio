import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserDomain } from '../domain/user.domain';
import { USER_ROLES_KEY } from '../roles.decorator';
import type { UserRole } from '../../../generated/prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      USER_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: UserDomain }>();
    if (!request.user || !requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException(
        'Você não tem permissão para realizar esta ação.',
      );
    }
    return true;
  }
}
