import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean({ message: 'O status ativo deve ser verdadeiro ou falso.' })
  isActive!: boolean;
}
