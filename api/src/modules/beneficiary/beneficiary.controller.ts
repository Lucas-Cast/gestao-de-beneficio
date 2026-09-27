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
import { BeneficiaryService } from './service/beneficiary.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { ListBeneficiariesDto } from './dto/list-beneficiaries.dto';
import {
  BeneficiaryPageDto,
  BeneficiaryResponseDto,
} from './dto/beneficiary-response.dto';

@ApiTags('beneficiaries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('beneficiaries')
export class BeneficiaryController {
  constructor(private readonly service: BeneficiaryService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um beneficiário com endereço' })
  @ApiCreatedResponse({ type: BeneficiaryResponseDto })
  create(
    @Body() dto: CreateBeneficiaryDto,
    @Req() request: Request & { user: { id: string } },
  ) {
    return this.service.create(dto, request.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lista beneficiários com paginação e filtros' })
  @ApiOkResponse({ type: BeneficiaryPageDto })
  findAll(@Query() query: ListBeneficiariesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um beneficiário' })
  @ApiOkResponse({ type: BeneficiaryResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um beneficiário e seu endereço' })
  @ApiOkResponse({ type: BeneficiaryResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBeneficiaryDto,
    @Req() request: Request & { user: { id: string } },
  ) {
    return this.service.update(id, dto, request.user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Exclui logicamente um beneficiário' })
  @ApiNoContentResponse({ description: 'Beneficiário excluído.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request & { user: { id: string } },
  ) {
    return this.service.remove(id, request.user.id);
  }
}
