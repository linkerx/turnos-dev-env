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
import { TimeSlotsService } from './time-slots.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Time Slots')
@Controller('time-slots')
@UseGuards(KeycloakAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TimeSlotsController {
  constructor(private readonly timeSlotsService: TimeSlotsService) {}

  @Post()
  @RequirePermissions('create_time_slot')
  @ApiOperation({ summary: 'Create a new time slot' })
  create(@Body() createTimeSlotDto: CreateTimeSlotDto, @CurrentUser() user: any) {
    return this.timeSlotsService.create(createTimeSlotDto, user);
  }

  @Get('agenda/:agendaId')
  @RequirePermissions('view_time_slots')
  @ApiOperation({ summary: 'Get all time slots for an agenda' })
  findByAgenda(@Param('agendaId') agendaId: string) {
    return this.timeSlotsService.findByAgenda(agendaId);
  }

  @Get('gestor/my-calendar')
  @RequirePermissions('view_own_calendar')
  @ApiOperation({ summary: 'Get my calendar (all my time slots across agendas)' })
  findMyCalendar(@CurrentUser() user: any) {
    return this.timeSlotsService.findByGestor(user.id);
  }

  @Get('gestor/:gestorId/calendar')
  @RequirePermissions('view_all_calendars')
  @ApiOperation({ summary: 'Get calendar for specific gestor (Admin only)' })
  findGestorCalendar(@Param('gestorId') gestorId: string) {
    return this.timeSlotsService.findByGestor(gestorId);
  }

  @Get('available/:agendaId')
  @RequirePermissions('view_time_slots')
  @ApiOperation({ summary: 'Get available time slots for an agenda' })
  @ApiQuery({ name: 'date', required: false, example: '2024-01-15' })
  findAvailableSlots(@Param('agendaId') agendaId: string, @Query('date') date?: string) {
    return this.timeSlotsService.findAvailableSlots(agendaId, date);
  }

  @Get(':id')
  @RequirePermissions('view_time_slots')
  @ApiOperation({ summary: 'Get time slot by ID' })
  findOne(@Param('id') id: string) {
    return this.timeSlotsService.findOne(id);
  }

  @Delete(':id')
  @RequirePermissions('delete_time_slot')
  @ApiOperation({ summary: 'Delete time slot' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.timeSlotsService.remove(id, user);
  }
}
