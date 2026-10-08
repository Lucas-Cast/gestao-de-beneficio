import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserDomain } from './domain/user.domain';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserService } from './service/user.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { IsPublic } from '../../common/decorators/is-public.decorator';
import { ListUsersDto } from './dto/list-users.dto';
import { UserPageResponseDto } from './dto/user-page-response.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { RolesGuard } from './guard/roles.guard';
import { Roles } from './roles.decorator';
import type { Request } from 'express';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @IsPublic()
  @Post()
  @ApiOperation({ summary: 'Cria um usuário' })
  @ApiCreatedResponse({ type: UserDomain })
  @ApiConflictResponse({ description: 'E-mail já está em uso.' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDomain> {
    return this.userService.create(createUserDto);
  }

  @IsPublic()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica um usuario' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'E-mail ou senha invalidos.' })
  async login(@Body() loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    return this.userService.login(loginUserDto);
  }

  @ApiBearerAuth()
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lista usuários ativos e desativados' })
  @ApiOkResponse({ type: UserPageResponseDto })
  @ApiForbiddenResponse({
    description: 'Acesso permitido apenas a administradores.',
  })
  async findAll(@Query() query: ListUsersDto) {
    return this.userService.findAll(query);
  }

  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Busca um usuário ativo por ID' })
  @ApiOkResponse({ type: UserDomain })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserDomain> {
    return this.userService.findOne(id);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualiza um usuário ativo' })
  @ApiOkResponse({ type: UserDomain })
  @ApiConflictResponse({ description: 'E-mail já está em uso.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDomain> {
    return this.userService.update(id, updateUserDto);
  }

  @ApiBearerAuth()
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Ativa ou desativa um usuário' })
  @ApiOkResponse({ type: UserDomain })
  @ApiForbiddenResponse({
    description: 'Acesso permitido apenas a administradores.',
  })
  async setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() request: Request & { user: UserDomain },
  ): Promise<UserDomain> {
    return this.userService.setActive(id, dto.isActive, request.user.id);
  }

  @ApiBearerAuth()
  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Altera a função de um usuário' })
  @ApiOkResponse({ type: UserDomain })
  @ApiForbiddenResponse({
    description: 'Acesso permitido apenas a administradores.',
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiConflictResponse({
    description:
      'Não é permitido alterar a própria função ou rebaixar o último administrador ativo.',
  })
  async setRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() request: Request & { user: UserDomain },
  ): Promise<UserDomain> {
    return this.userService.setRole(id, dto.role, request.user.id);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove logicamente um usuário' })
  @ApiNoContentResponse({ description: 'Usuário removido com sucesso.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request & { user: UserDomain },
  ): Promise<void> {
    await this.userService.remove(id, request.user.id);
  }
}
