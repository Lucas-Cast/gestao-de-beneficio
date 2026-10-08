import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListBasketDeliveriesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Busca por beneficiário, cesta ou operador.',
  })
  @IsOptional()
  @IsString({ message: 'A busca deve ser um texto.' })
  @MaxLength(200, { message: 'A busca pode ter no máximo 200 caracteres.' })
  search?: string;
}
