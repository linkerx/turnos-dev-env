import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EspaciosService } from './espacios.service';
import { CreateEspacioDto } from './dto/create-espacio.dto';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Espacios')
@Controller('espacios')
@UseGuards(KeycloakAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class EspaciosController {
  constructor(private readonly espaciosService: EspaciosService) {}

  @Post()
  @RequirePermissions('create_espacio')
  @ApiOperation({ summary: 'Create a new espacio (individual or grupo)' })
  create(@Body() createEspacioDto: CreateEspacioDto, @CurrentUser() user: any) {
    return this.espaciosService.create(createEspacioDto, user);
  }

  @Get('agenda/:agendaId')
  @RequirePermissions('view_espacios')
  @ApiOperation({ summary: 'Get all espacios for an agenda' })
  findByAgenda(@Param('agendaId') agendaId: string) {
    return this.espaciosService.findByAgenda(agendaId);
  }

  @Get('gestor/my-calendar')
  @RequirePermissions('view_own_calendar')
  @ApiOperation({ summary: 'Get my calendar (all my espacios across agendas)' })
  findMyCalendar(@CurrentUser() user: any) {
    return this.espaciosService.findByGestor(user.id);
  }

  @Get('gestor/:gestorId/calendar')
  @RequirePermissions('view_all_calendars')
  @ApiOperation({ summary: 'Get calendar for specific gestor (Admin only)' })
  findGestorCalendar(@Param('gestorId') gestorId: string) {
    return this.espaciosService.findByGestor(gestorId);
  }

  @Get('available/:agendaId')
  @RequirePermissions('view_espacios')
  @ApiOperation({ summary: 'Get available espacios for an agenda' })
  @ApiQuery({ name: 'date', required: false, example: '2024-01-15' })
  findAvailableEspacios(@Param('agendaId') agendaId: string, @Query('date') date?: string) {
    return this.espaciosService.findAvailableEspacios(agendaId, date);
  }

  @Get(':id')
  @RequirePermissions('view_espacios')
  @ApiOperation({ summary: 'Get espacio by ID' })
  findOne(@Param('id') id: string) {
    return this.espaciosService.findOne(id);
  }

  @Delete(':id')
  @RequirePermissions('delete_espacio')
  @ApiOperation({ summary: 'Delete espacio' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.espaciosService.remove(id, user);
  }
}
