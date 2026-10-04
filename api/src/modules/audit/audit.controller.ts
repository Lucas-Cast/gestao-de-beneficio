import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../user/guard/jwt-auth.guard';
import { AuditLogPageDto } from './dto/audit-log-response.dto';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';
import { AuditService } from './service/audit.service';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista alterações auditadas com filtros e paginação',
  })
  @ApiOkResponse({ type: AuditLogPageDto })
  findAll(@Query() query: ListAuditLogsDto) {
    return this.service.findAll(query);
  }
}
