import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno, TurnoStatus } from './turno.entity';
import { TimeSlot } from '../time-slots/time-slot.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';

@Injectable()
export class TurnosService {
  constructor(
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
    @InjectRepository(TimeSlot)
    private timeSlotRepository: Repository<TimeSlot>,
  ) {}

  async create(createTurnoDto: CreateTurnoDto, userId: string) {
    const { timeSlotId, startTime, notas } = createTurnoDto;

    const start = new Date(startTime);

    // Find the time slot
    const timeSlot = await this.timeSlotRepository.findOne({
      where: { id: timeSlotId },
      relations: ['turnos'],
    });

    if (!timeSlot) {
      throw new NotFoundException('Time slot not found');
    }

    if (!timeSlot.activo) {
      throw new ConflictException('Time slot is not active');
    }

    // Validate start time is within time slot bounds
    if (start < timeSlot.startTime || start >= timeSlot.endTime) {
      throw new ConflictException('Start time must be within the time slot range');
    }

    // Calculate end time based on slot duration
    const end = new Date(start.getTime() + timeSlot.slotDuration * 60000);

    if (end > timeSlot.endTime) {
      throw new ConflictException('Turno would exceed time slot end time');
    }

    // Check if the exact time slot is already taken
    const existingTurno = await this.turnoRepository.findOne({
      where: {
        timeSlotId,
        startTime: start,
        status: TurnoStatus.CONFIRMED,
      },
    });

    if (existingTurno) {
      throw new ConflictException('This turno slot is already taken');
    }

    // Create the turno
    const turno = this.turnoRepository.create({
      timeSlotId,
      userId,
      startTime: start,
      endTime: end,
      notas,
      status: TurnoStatus.PENDING,
    });

    return this.turnoRepository.save(turno);
  }

  async findByUser(userId: string) {
    return this.turnoRepository.find({
      where: { userId },
      relations: ['timeSlot', 'timeSlot.gestor', 'timeSlot.agenda'],
      order: { startTime: 'ASC' },
    });
  }

  async findByGestor(gestorId: string) {
    return this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.timeSlot', 'timeSlot')
      .leftJoinAndSelect('turno.user', 'user')
      .leftJoinAndSelect('timeSlot.agenda', 'agenda')
      .where('timeSlot.gestorId = :gestorId', { gestorId })
      .orderBy('turno.startTime', 'ASC')
      .getMany();
  }

  async findOne(id: string) {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['timeSlot', 'timeSlot.gestor', 'timeSlot.agenda', 'user'],
    });

    if (!turno) {
      throw new NotFoundException('Turno not found');
    }

    return turno;
  }

  async confirm(id: string, gestorId: string) {
    const turno = await this.findOne(id);

    if (turno.timeSlot.gestorId !== gestorId) {
      throw new ForbiddenException('You can only confirm your own turnos');
    }

    if (turno.status === TurnoStatus.CANCELLED) {
      throw new ConflictException('Cannot confirm a cancelled turno');
    }

    turno.status = TurnoStatus.CONFIRMED;
    return this.turnoRepository.save(turno);
  }

  async cancel(id: string, userId: string, role: 'user' | 'gestor') {
    const turno = await this.findOne(id);

    // Users can cancel their own turnos, gestores can cancel turnos in their time slots
    if (role === 'user' && turno.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own turnos');
    }

    if (role === 'gestor' && turno.timeSlot.gestorId !== userId) {
      throw new ForbiddenException('You can only cancel turnos in your time slots');
    }

    if (turno.status === TurnoStatus.COMPLETED) {
      throw new ConflictException('Cannot cancel a completed turno');
    }

    turno.status = TurnoStatus.CANCELLED;
    return this.turnoRepository.save(turno);
  }

  async complete(id: string, gestorId: string) {
    const turno = await this.findOne(id);

    if (turno.timeSlot.gestorId !== gestorId) {
      throw new ForbiddenException('You can only complete your own turnos');
    }

    if (turno.status !== TurnoStatus.CONFIRMED) {
      throw new ConflictException('Only confirmed turnos can be marked as completed');
    }

    turno.status = TurnoStatus.COMPLETED;
    return this.turnoRepository.save(turno);
  }

  // Helper method to find overlapping time slots (when user wants to choose gestor)
  async findOverlappingTimeSlots(agendaId: string, startTime: string) {
    const start = new Date(startTime);

    const timeSlots = await this.timeSlotRepository
      .createQueryBuilder('ts')
      .leftJoinAndSelect('ts.gestor', 'gestor')
      .where('ts.agendaId = :agendaId', { agendaId })
      .andWhere('ts.activo = :activo', { activo: true })
      .andWhere('ts.startTime <= :start', { start })
      .andWhere('ts.endTime > :start', { start })
      .getMany();

    return timeSlots;
  }
}
