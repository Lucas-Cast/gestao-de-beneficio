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
import { StockMovementService } from './service/stock-movement.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ListStockMovementsDto } from './dto/list-stock-movements.dto';
import {
  StockMovementPageDto,
  StockMovementResponseDto,
} from './dto/stock-movement-response.dto';

@ApiTags('stock-movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock-movements')
export class StockMovementController {
  constructor(private readonly service: StockMovementService) {}

  @Post()
  @ApiOperation({ summary: 'Registra uma entrada ou saída manual de estoque' })
  @ApiCreatedResponse({ type: StockMovementResponseDto })
  create(
    @Body() dto: CreateStockMovementDto,
    @Req() request: Request & { user: { id: string } },
  ) {
    return this.service.create(dto, request.user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista o histórico de movimentos com filtros e paginação',
  })
  @ApiOkResponse({ type: StockMovementPageDto })
  findAll(@Query() query: ListStockMovementsDto) {
    return this.service.findAll(query);
  }
}
