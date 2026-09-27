import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListBeneficiariesDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'A busca deve ser um texto.' })
  @MaxLength(200, { message: 'A busca pode ter no máximo 200 caracteres.' })
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[.\s-]/g, '') : value,
  )
  @Matches(/^\d{11}$/, { message: 'O CPF deve conter 11 dígitos.' })
  cpf?: string;
}
