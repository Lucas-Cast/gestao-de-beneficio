import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { JwtAuthGuard } from '../user/guard/jwt-auth.guard';
import { SupplyService } from './service/supply.service';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { ListSuppliesDto } from './dto/list-supplies.dto';
import { SupplyPageDto, SupplyResponseDto } from './dto/supply-response.dto';

@ApiTags('supplies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('supplies')
export class SupplyController {
  constructor(private readonly service: SupplyService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra um mantimento com saldo inicial opcional',
  })
  @ApiCreatedResponse({ type: SupplyResponseDto })
  create(@Body() dto: CreateSupplyDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista mantimentos com paginação e filtros' })
  @ApiOkResponse({ type: SupplyPageDto })
  findAll(@Query() query: ListSuppliesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um mantimento' })
  @ApiOkResponse({ type: SupplyResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza os dados do mantimento, exceto seu saldo',
  })
  @ApiOkResponse({ type: SupplyResponseDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSupplyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Exclui logicamente um mantimento' })
  @ApiNoContentResponse({ description: 'Mantimento excluído.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
