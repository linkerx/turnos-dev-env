import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Espacio } from './espacio.entity';
import { Agenda } from '../agendas/agenda.entity';
import { Grupo } from '../grupos/grupo.entity';
import { CreateEspacioDto } from './dto/create-espacio.dto';

@Injectable()
export class EspaciosService {
  constructor(
    @InjectRepository(Espacio)
    private espacioRepository: Repository<Espacio>,
    @InjectRepository(Agenda)
    private agendaRepository: Repository<Agenda>,
    @InjectRepository(Grupo)
    private grupoRepository: Repository<Grupo>,
  ) {}

  async create(createEspacioDto: CreateEspacioDto, currentUser: any) {
    const { agendaId, grupoId, startTime, endTime, slotDuration } = createEspacioDto;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate time range
    if (start >= end) {
      throw new ConflictException('Start time must be before end time');
    }

    // Only gestores can create espacios (checked by permissions)
    if (currentUser.userType !== 'gestor') {
      throw new ForbiddenException('Only gestores can create espacios');
    }

    const gestorId = currentUser.id;

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

    let grupo: Grupo | null = null;
    let gestoresIds: string[] = [gestorId];

    // If grupoId is provided, validate and get grupo
    if (grupoId) {
      grupo = await this.grupoRepository.findOne({
        where: { id: grupoId, activo: true },
        relations: ['gestores'],
      });

      if (!grupo) {
        throw new NotFoundException('Grupo not found or inactive');
      }

      // Verify that current gestor is part of the grupo
      const isGestorInGrupo = grupo.gestores.some((g) => g.id === gestorId);
      if (!isGestorInGrupo) {
        throw new ForbiddenException(
          'You must be part of the grupo to create espacios for it',
        );
      }

      // Get all gestor IDs from grupo
      gestoresIds = grupo.gestores.map((g) => g.id);
    }

    // CRITICAL: Check for overlaps with espacios of ALL gestores involved
    // (either the single gestor or all gestores in the grupo)
    for (const currentGestorId of gestoresIds) {
      const overlappingEspacios = await this.espacioRepository
        .createQueryBuilder('e')
        .leftJoinAndSelect('e.grupo', 'grupo')
        .leftJoinAndSelect('grupo.gestores', 'gestores')
        .where('e.activo = :activo', { activo: true })
        .andWhere(
          '(e.startTime < :end AND e.endTime > :start)',
          { start, end },
        )
        .andWhere(
          // El espacio individual del gestor o es parte de un grupo que incluye al gestor
          `(e.gestorId = :currentGestorId OR
           (e.grupoId IS NOT NULL AND gestores.id = :currentGestorId))`,
          { currentGestorId },
        )
        .getMany();

      if (overlappingEspacios.length > 0) {
        // Find gestor name for better error message
        const gestorWithConflict = grupo
          ? grupo.gestores.find((g) => g.id === currentGestorId)
          : { nombre: 'you' };

        throw new ConflictException(
          `Espacio overlaps with existing espacio(s) in ${gestorWithConflict?.nombre || 'a gestor'}'s calendar. ` +
          `${grupoId ? 'All gestores in a grupo' : 'You'} cannot have overlapping espacios across different agendas.`,
        );
      }
    }

    // Create the espacio
    const espacio = this.espacioRepository.create({
      agendaId,
      gestorId,
      grupoId: grupoId || null,
      startTime: start,
      endTime: end,
      slotDuration,
    });

    return this.espacioRepository.save(espacio);
  }

  async findByAgenda(agendaId: string) {
    return this.espacioRepository.find({
      where: { agendaId, activo: true },
      relations: ['gestor', 'grupo', 'grupo.gestores'],
      order: { startTime: 'ASC' },
    });
  }

  async findByGestor(gestorId: string) {
    // Find both individual espacios and grupo espacios
    const espacios = await this.espacioRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.agenda', 'agenda')
      .leftJoinAndSelect('e.grupo', 'grupo')
      .leftJoinAndSelect('grupo.gestores', 'gestores')
      .leftJoinAndSelect('e.turnos', 'turnos')
      .where('e.activo = :activo', { activo: true })
      .andWhere(
        '(e.gestorId = :gestorId OR gestores.id = :gestorId)',
        { gestorId },
      )
      .orderBy('e.startTime', 'ASC')
      .getMany();

    return espacios;
  }

  async findAvailableEspacios(agendaId: string, date?: string) {
    const query = this.espacioRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.gestor', 'gestor')
      .leftJoinAndSelect('e.grupo', 'grupo')
      .leftJoinAndSelect('grupo.gestores', 'gestores')
      .leftJoinAndSelect('e.turnos', 'turno')
      .where('e.agendaId = :agendaId', { agendaId })
      .andWhere('e.activo = :activo', { activo: true })
      .andWhere('e.endTime > :now', { now: new Date() });

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query
        .andWhere('e.startTime >= :startOfDay', { startOfDay })
        .andWhere('e.startTime <= :endOfDay', { endOfDay });
    }

    return query.orderBy('e.startTime', 'ASC').getMany();
  }

  async findOne(id: string) {
    const espacio = await this.espacioRepository.findOne({
      where: { id },
      relations: ['agenda', 'gestor', 'grupo', 'grupo.gestores', 'turnos'],
    });

    if (!espacio) {
      throw new NotFoundException('Espacio not found');
    }

    return espacio;
  }

  async remove(id: string, currentUser: any) {
    const espacio = await this.findOne(id);

    // Solo el gestor dueño o admin con view_all_calendars pueden borrar
    const canDelete =
      (currentUser.userType === 'gestor' && espacio.gestorId === currentUser.id) ||
      currentUser.permissions.includes('view_all_calendars');

    if (!canDelete) {
      throw new ForbiddenException('You can only delete your own espacios');
    }

    // Check if there are confirmed turnos
    const hasConfirmedTurnos = espacio.turnos.some(
      (t) => t.status === 'confirmed' || t.status === 'pending',
    );

    if (hasConfirmedTurnos) {
      throw new ConflictException(
        'Cannot delete espacio with confirmed or pending turnos',
      );
    }

    espacio.activo = false;
    return this.espacioRepository.save(espacio);
  }
}
