import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TurnosService } from './turnos.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Turnos')
@Controller('turnos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Post()
  @Roles('user')
  @ApiOperation({ summary: 'Create a new turno (User only)' })
  create(@Body() createTurnoDto: CreateTurnoDto, @CurrentUser() user: any) {
    return this.turnosService.create(createTurnoDto, user.id);
  }

  @Get('my-turnos')
  @Roles('user')
  @ApiOperation({ summary: 'Get my turnos (User only)' })
  findMyTurnos(@CurrentUser() user: any) {
    return this.turnosService.findByUser(user.id);
  }

  @Get('gestor/my-turnos')
  @Roles('gestor')
  @ApiOperation({ summary: 'Get turnos for my time slots (Gestor only)' })
  findGestorTurnos(@CurrentUser() user: any) {
    return this.turnosService.findByGestor(user.id);
  }

  @Get('overlapping')
  @ApiOperation({ summary: 'Find overlapping time slots for a given time' })
  @ApiQuery({ name: 'agendaId', required: true })
  @ApiQuery({ name: 'startTime', required: true, example: '2024-01-15T09:00:00Z' })
  findOverlapping(@Query('agendaId') agendaId: string, @Query('startTime') startTime: string) {
    return this.turnosService.findOverlappingTimeSlots(agendaId, startTime);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get turno by ID' })
  findOne(@Param('id') id: string) {
    return this.turnosService.findOne(id);
  }

  @Patch(':id/confirm')
  @Roles('gestor')
  @ApiOperation({ summary: 'Confirm a turno (Gestor only)' })
  confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.turnosService.confirm(id, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a turno' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.turnosService.cancel(id, user.id, user.role);
  }

  @Patch(':id/complete')
  @Roles('gestor')
  @ApiOperation({ summary: 'Mark turno as completed (Gestor only)' })
  complete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.turnosService.complete(id, user.id);
  }
}
