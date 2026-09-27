import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../user/guard/jwt-auth.guard';
import { BasketService } from './service/basket.service';
import { CreateBasketDto } from './dto/create-basket.dto';
import { ListBasketsDto } from './dto/list-baskets.dto';
import { BasketPageDto, BasketResponseDto } from './dto/basket-response.dto';

@ApiTags('baskets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('baskets')
export class BasketController {
  constructor(private readonly service: BasketService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra uma cesta com composição fixa' })
  @ApiCreatedResponse({ type: BasketResponseDto })
  create(
    @Body() dto: CreateBasketDto,
    @Req() request: Request & { user: { id: string } },
  ) {
    return this.service.create(dto, request.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lista cestas com paginação e filtros' })
  @ApiOkResponse({ type: BasketPageDto })
  findAll(@Query() query: ListBasketsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta uma cesta e seus mantimentos' })
  @ApiOkResponse({ type: BasketResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Exclui logicamente uma cesta e sua composição' })
  @ApiNoContentResponse({ description: 'Cesta excluída.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request & { user: { id: string } },
  ) {
    return this.service.remove(id, request.user.id);
  }
}
