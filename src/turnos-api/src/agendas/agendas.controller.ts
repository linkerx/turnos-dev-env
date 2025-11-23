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
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Agendas')
@Controller('agendas')
@UseGuards(KeycloakAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AgendasController {
  constructor(private readonly agendasService: AgendasService) {}

  @Post()
  @RequirePermissions('create_agenda')
  @ApiOperation({ summary: 'Create a new agenda' })
  @ApiResponse({ status: 201, description: 'Agenda created successfully' })
  create(@Body() createAgendaDto: CreateAgendaDto, @CurrentUser() user: any) {
    return this.agendasService.create(createAgendaDto, user);
  }

  @Get()
  @RequirePermissions('view_agendas', 'view_all_agendas')
  @ApiOperation({ summary: 'Get all agendas (filtered by permissions)' })
  findAll(@CurrentUser() user: any) {
    return this.agendasService.findAll(user);
  }

  @Get(':id')
  @RequirePermissions('view_agendas', 'view_all_agendas')
  @ApiOperation({ summary: 'Get agenda by ID (filtered by permissions)' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.agendasService.findOne(id, user);
  }

  @Post(':id/gestores/:gestorId')
  @RequirePermissions('assign_gestores_to_agendas')
  @ApiOperation({ summary: 'Add gestor to agenda (Admin only)' })
  addGestor(
    @Param('id') id: string,
    @Param('gestorId') gestorId: string,
  ) {
    return this.agendasService.addGestor(id, gestorId);
  }

  @Delete(':id/gestores/:gestorId')
  @RequirePermissions('assign_gestores_to_agendas')
  @ApiOperation({ summary: 'Remove gestor from agenda (Admin only)' })
  removeGestor(
    @Param('id') id: string,
    @Param('gestorId') gestorId: string,
  ) {
    return this.agendasService.removeGestor(id, gestorId);
  }
}
