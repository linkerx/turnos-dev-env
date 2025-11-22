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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Time Slots')
@Controller('time-slots')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TimeSlotsController {
  constructor(private readonly timeSlotsService: TimeSlotsService) {}

  @Post()
  @Roles('gestor')
  @ApiOperation({ summary: 'Create a new time slot (Gestor only)' })
  create(@Body() createTimeSlotDto: CreateTimeSlotDto, @CurrentUser() user: any) {
    return this.timeSlotsService.create(createTimeSlotDto, user.id);
  }

  @Get('agenda/:agendaId')
  @ApiOperation({ summary: 'Get all time slots for an agenda' })
  findByAgenda(@Param('agendaId') agendaId: string) {
    return this.timeSlotsService.findByAgenda(agendaId);
  }

  @Get('gestor/my-calendar')
  @Roles('gestor')
  @ApiOperation({ summary: 'Get my calendar (all my time slots across agendas)' })
  findMyCalendar(@CurrentUser() user: any) {
    return this.timeSlotsService.findByGestor(user.id);
  }

  @Get('available/:agendaId')
  @ApiOperation({ summary: 'Get available time slots for an agenda' })
  @ApiQuery({ name: 'date', required: false, example: '2024-01-15' })
  findAvailableSlots(@Param('agendaId') agendaId: string, @Query('date') date?: string) {
    return this.timeSlotsService.findAvailableSlots(agendaId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get time slot by ID' })
  findOne(@Param('id') id: string) {
    return this.timeSlotsService.findOne(id);
  }

  @Delete(':id')
  @Roles('gestor')
  @ApiOperation({ summary: 'Delete time slot (Gestor only)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.timeSlotsService.remove(id, user.id);
  }
}
