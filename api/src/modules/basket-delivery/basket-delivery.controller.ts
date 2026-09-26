import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../user/guard/jwt-auth.guard';
import { BasketDeliveryService } from './service/basket-delivery.service';
import { CreateBasketDeliveryDto } from './dto/create-basket-delivery.dto';
import { BasketDeliveryResponseDto } from './dto/basket-delivery-response.dto';

@ApiTags('basket-deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('basket-deliveries')
export class BasketDeliveryController {
  constructor(private readonly service: BasketDeliveryService) {}

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
