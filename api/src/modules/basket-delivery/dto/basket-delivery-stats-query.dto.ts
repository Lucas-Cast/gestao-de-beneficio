import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsTimeZone } from 'class-validator';

export class BasketDeliveryStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Fuso horário IANA usado para definir hoje e o mês atual.',
    example: 'America/Sao_Paulo',
    default: 'America/Sao_Paulo',
  })
  @IsOptional()
  @IsTimeZone({ message: 'Informe um fuso horário válido.' })
  timeZone = 'America/Sao_Paulo';
}
