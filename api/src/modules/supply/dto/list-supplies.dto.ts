import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { SUPPLY_UNITS, SupplyUnit } from '../domain/supply.domain';

export class ListSuppliesDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'A busca deve ser um texto.' })
  @MaxLength(200, { message: 'A busca pode ter no máximo 200 caracteres.' })
  search?: string;

  @ApiPropertyOptional({ enum: SUPPLY_UNITS })
  @IsOptional()
  @IsIn(SUPPLY_UNITS, { message: 'Selecione uma unidade de medida válida.' })
  unit?: SupplyUnit;
}
