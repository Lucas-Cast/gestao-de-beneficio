import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const USER_ROLES = ['ADMIN', 'COMMON'] as const;

export class UpdateUserRoleDto {
  @ApiProperty({ enum: USER_ROLES, example: 'ADMIN' })
  @IsIn(USER_ROLES, {
    message: 'A função do usuário deve ser ADMIN ou COMMON.',
  })
  role!: (typeof USER_ROLES)[number];
}
