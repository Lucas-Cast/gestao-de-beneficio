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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
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
  @ApiOperation({ summary: 'Lista os usuários ativos' })
  @ApiOkResponse({ type: UserDomain, isArray: true })
  async findAll(): Promise<UserDomain[]> {
    return this.userService.findAll();
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Busca um usuário ativo por ID' })
  @ApiOkResponse({ type: UserDomain })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserDomain> {
    return this.userService.findOne(id);
  }

  @ApiBearerAuth()
  @Patch(':id')
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
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove logicamente um usuário' })
  @ApiNoContentResponse({ description: 'Usuário removido com sucesso.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.userService.remove(id);
  }
}
