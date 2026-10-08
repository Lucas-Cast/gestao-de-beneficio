import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../user/guard/jwt-auth.guard';
import { BasketDeliveryService } from './service/basket-delivery.service';
import { CreateBasketDeliveryDto } from './dto/create-basket-delivery.dto';
import { BasketDeliveryResponseDto } from './dto/basket-delivery-response.dto';
import { ListBasketDeliveriesDto } from './dto/list-basket-deliveries.dto';
import { BasketDeliveryHistoryPageDto } from './dto/basket-delivery-history-response.dto';
import { BasketDeliveryStatsQueryDto } from './dto/basket-delivery-stats-query.dto';
import { BasketDeliveryStatsResponseDto } from './dto/basket-delivery-stats-response.dto';

@ApiTags('basket-deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('basket-deliveries')
export class BasketDeliveryController {
  constructor(private readonly service: BasketDeliveryService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Retorna indicadores de entregas da instituição' })
  @ApiOkResponse({ type: BasketDeliveryStatsResponseDto })
  getStats(@Query() query: BasketDeliveryStatsQueryDto) {
    return this.service.getStats(query);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista o histórico de entregas com paginação e busca',
  })
  @ApiOkResponse({ type: BasketDeliveryHistoryPageDto })
  findAll(@Query() query: ListBasketDeliveriesDto) {
    return this.service.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Registra uma entrega de cestas e baixa o estoque' })
  @ApiCreatedResponse({ type: BasketDeliveryResponseDto })
  create(
    @Body() dto: CreateBasketDeliveryDto,
    @Req() request: Request & { user: { id: string } },
  ) {
    return this.service.create(dto, request.user.id);
  }
}
