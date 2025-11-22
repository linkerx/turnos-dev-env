import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { TimeSlot } from './time-slot.entity';
import { Agenda } from '../agendas/agenda.entity';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';

@Injectable()
export class TimeSlotsService {
  constructor(
    @InjectRepository(TimeSlot)
    private timeSlotRepository: Repository<TimeSlot>,
    @InjectRepository(Agenda)
    private agendaRepository: Repository<Agenda>,
  ) {}

  async create(createTimeSlotDto: CreateTimeSlotDto, gestorId: string) {
    const { agendaId, startTime, endTime, slotDuration } = createTimeSlotDto;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate time range
    if (start >= end) {
      throw new ConflictException('Start time must be before end time');
    }

    // Verify agenda exists and gestor has access
    const agenda = await this.agendaRepository.findOne({
      where: { id: agendaId },
      relations: ['gestores'],
    });

    if (!agenda) {
      throw new NotFoundException('Agenda not found');
    }

    const hasAccess = agenda.gestores.some((g) => g.id === gestorId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this agenda');
    }

    // CRITICAL: Check for overlaps with other time slots of the same gestor across ALL agendas
    const overlappingSlots = await this.timeSlotRepository
      .createQueryBuilder('ts')
      .where('ts.gestorId = :gestorId', { gestorId })
      .andWhere('ts.activo = :activo', { activo: true })
      .andWhere(
        '(ts.startTime < :end AND ts.endTime > :start)',
        { start, end },
      )
      .getMany();

    if (overlappingSlots.length > 0) {
      throw new ConflictException(
        `Time slot overlaps with existing slot(s) in your calendar. ` +
        `You cannot have overlapping time slots across different agendas.`,
      );
    }

    // Create the time slot
    const timeSlot = this.timeSlotRepository.create({
      agendaId,
      gestorId,
      startTime: start,
      endTime: end,
      slotDuration,
    });

    return this.timeSlotRepository.save(timeSlot);
  }

  async findByAgenda(agendaId: string) {
    return this.timeSlotRepository.find({
      where: { agendaId, activo: true },
      relations: ['gestor'],
      order: { startTime: 'ASC' },
    });
  }

  async findByGestor(gestorId: string) {
    return this.timeSlotRepository.find({
      where: { gestorId, activo: true },
      relations: ['agenda', 'turnos'],
      order: { startTime: 'ASC' },
    });
  }

  async findAvailableSlots(agendaId: string, date?: string) {
    const query = this.timeSlotRepository
      .createQueryBuilder('ts')
      .leftJoinAndSelect('ts.gestor', 'gestor')
      .leftJoinAndSelect('ts.turnos', 'turno')
      .where('ts.agendaId = :agendaId', { agendaId })
      .andWhere('ts.activo = :activo', { activo: true })
      .andWhere('ts.endTime > :now', { now: new Date() });

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query
        .andWhere('ts.startTime >= :startOfDay', { startOfDay })
        .andWhere('ts.startTime <= :endOfDay', { endOfDay });
    }

    return query.orderBy('ts.startTime', 'ASC').getMany();
  }

  async findOne(id: string) {
    const timeSlot = await this.timeSlotRepository.findOne({
      where: { id },
      relations: ['agenda', 'gestor', 'turnos'],
    });

    if (!timeSlot) {
      throw new NotFoundException('Time slot not found');
    }

    return timeSlot;
  }

  async remove(id: string, gestorId: string) {
    const timeSlot = await this.findOne(id);

    if (timeSlot.gestorId !== gestorId) {
      throw new ForbiddenException('You can only delete your own time slots');
    }

    // Check if there are confirmed turnos
    const hasConfirmedTurnos = timeSlot.turnos.some(
      (t) => t.status === 'confirmed' || t.status === 'pending',
    );

    if (hasConfirmedTurnos) {
      throw new ConflictException(
        'Cannot delete time slot with confirmed or pending turnos',
      );
    }

    timeSlot.activo = false;
    return this.timeSlotRepository.save(timeSlot);
  }
}
