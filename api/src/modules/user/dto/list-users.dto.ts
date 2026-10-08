import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export const USER_STATUS_FILTERS = ['ACTIVE', 'INACTIVE'] as const;
export type UserStatusFilter = (typeof USER_STATUS_FILTERS)[number];

export class ListUsersDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou e-mail' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'A busca deve ser um texto.' })
  @MaxLength(200, { message: 'A busca pode ter no máximo 200 caracteres.' })
  search?: string;

  @ApiPropertyOptional({ enum: USER_STATUS_FILTERS })
  @IsOptional()
  @IsIn(USER_STATUS_FILTERS, { message: 'O filtro de status é inválido.' })
  status?: UserStatusFilter;
}
