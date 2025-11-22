import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AgendasService } from './agendas.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Agendas')
@Controller('agendas')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AgendasController {
  constructor(private readonly agendasService: AgendasService) {}

  @Post()
  @Roles('gestor')
  @ApiOperation({ summary: 'Create a new agenda (Gestor only)' })
  @ApiResponse({ status: 201, description: 'Agenda created successfully' })
  create(@Body() createAgendaDto: CreateAgendaDto, @CurrentUser() user: any) {
    return this.agendasService.create(createAgendaDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agendas' })
  findAll(@CurrentUser() user: any) {
    const gestorId = user.role === 'gestor' ? user.id : undefined;
    return this.agendasService.findAll(gestorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agenda by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const gestorId = user.role === 'gestor' ? user.id : undefined;
    return this.agendasService.findOne(id, gestorId);
  }

  @Post(':id/gestores/:gestorId')
  @Roles('gestor')
  @ApiOperation({ summary: 'Add gestor to agenda (Gestor only)' })
  addGestor(
    @Param('id') id: string,
    @Param('gestorId') gestorId: string,
    @CurrentUser() user: any,
  ) {
    return this.agendasService.addGestor(id, gestorId, user.id);
  }

  @Delete(':id/gestores/:gestorId')
  @Roles('gestor')
  @ApiOperation({ summary: 'Remove gestor from agenda (Gestor only)' })
  removeGestor(
    @Param('id') id: string,
    @Param('gestorId') gestorId: string,
    @CurrentUser() user: any,
  ) {
    return this.agendasService.removeGestor(id, gestorId, user.id);
  }
}
