import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../generated/prisma/client';

export const USER_ROLES_KEY = 'user-roles';
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(USER_ROLES_KEY, roles);
