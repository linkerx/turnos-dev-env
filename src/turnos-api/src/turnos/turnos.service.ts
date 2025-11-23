import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno, TurnoStatus } from './turno.entity';
import { Espacio } from '../espacios/espacio.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';

@Injectable()
export class TurnosService {
  constructor(
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
    @InjectRepository(Espacio)
    private espacioRepository: Repository<Espacio>,
  ) {}

  async create(createTurnoDto: CreateTurnoDto, userId: string) {
    const { espacioId, startTime, notas } = createTurnoDto;

    const start = new Date(startTime);

    // Find the espacio
    const espacio = await this.espacioRepository.findOne({
      where: { id: espacioId },
      relations: ['turnos'],
    });

    if (!espacio) {
      throw new NotFoundException('Espacio not found');
    }

    if (!espacio.activo) {
      throw new ConflictException('Espacio is not active');
    }

    // Validate start time is within espacio bounds
    if (start < espacio.startTime || start >= espacio.endTime) {
      throw new ConflictException('Start time must be within the espacio range');
    }

    // Calculate end time based on slot duration
    const end = new Date(start.getTime() + espacio.slotDuration * 60000);

    if (end > espacio.endTime) {
      throw new ConflictException('Turno would exceed espacio end time');
    }

    // Check if the exact time slot is already taken
    const existingTurno = await this.turnoRepository.findOne({
      where: {
        espacioId,
        startTime: start,
        status: TurnoStatus.CONFIRMED,
      },
    });

    if (existingTurno) {
      throw new ConflictException('This turno slot is already taken');
    }

    // Create the turno
    const turno = this.turnoRepository.create({
      espacioId,
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
      relations: ['espacio', 'espacio.gestor', 'espacio.agenda'],
      order: { startTime: 'ASC' },
    });
  }

  async findByGestor(gestorId: string) {
    return this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.espacio', 'espacio')
      .leftJoinAndSelect('turno.user', 'user')
      .leftJoinAndSelect('espacio.agenda', 'agenda')
      .where('espacio.gestorId = :gestorId', { gestorId })
      .orderBy('turno.startTime', 'ASC')
      .getMany();
  }

  async findOne(id: string) {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['espacio', 'espacio.gestor', 'espacio.agenda', 'user'],
    });

    if (!turno) {
      throw new NotFoundException('Turno not found');
    }

    return turno;
  }

  async confirm(id: string, gestorId: string) {
    const turno = await this.findOne(id);

    if (turno.espacio.gestorId !== gestorId) {
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

    // Users can cancel their own turnos, gestores can cancel turnos in their espacios
    if (role === 'user' && turno.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own turnos');
    }

    if (role === 'gestor' && turno.espacio.gestorId !== userId) {
      throw new ForbiddenException('You can only cancel turnos in your espacios');
    }

    if (turno.status === TurnoStatus.COMPLETED) {
      throw new ConflictException('Cannot cancel a completed turno');
    }

    turno.status = TurnoStatus.CANCELLED;
    return this.turnoRepository.save(turno);
  }

  async complete(id: string, gestorId: string) {
    const turno = await this.findOne(id);

    if (turno.espacio.gestorId !== gestorId) {
      throw new ForbiddenException('You can only complete your own turnos');
    }

    if (turno.status !== TurnoStatus.CONFIRMED) {
      throw new ConflictException('Only confirmed turnos can be marked as completed');
    }

    turno.status = TurnoStatus.COMPLETED;
    return this.turnoRepository.save(turno);
  }

  // Helper method to find overlapping espacios (when user wants to choose gestor)
  async findOverlappingEspacios(agendaId: string, startTime: string) {
    const start = new Date(startTime);

    const espacios = await this.espacioRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.gestor', 'gestor')
      .where('e.agendaId = :agendaId', { agendaId })
      .andWhere('e.activo = :activo', { activo: true })
      .andWhere('e.startTime <= :start', { start })
      .andWhere('e.endTime > :start', { start })
      .getMany();

    return espacios;
  }
}
