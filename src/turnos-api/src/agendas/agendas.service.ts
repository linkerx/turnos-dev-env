import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Agenda } from './agenda.entity';
import { Gestor } from '../gestores/gestor.entity';
import { CreateAgendaDto } from './dto/create-agenda.dto';

@Injectable()
export class AgendasService {
  constructor(
    @InjectRepository(Agenda)
    private agendaRepository: Repository<Agenda>,
    @InjectRepository(Gestor)
    private gestorRepository: Repository<Gestor>,
  ) {}

  async create(createAgendaDto: CreateAgendaDto, currentGestorId: string) {
    const { nombre, descripcion, gestorIds } = createAgendaDto;

    // Ensure current gestor is included
    const allGestorIds = [...new Set([...gestorIds, currentGestorId])];

    // Verify all gestores exist
    const gestores = await this.gestorRepository.find({
      where: { id: In(allGestorIds) },
    });

    if (gestores.length !== allGestorIds.length) {
      throw new NotFoundException('One or more gestores not found');
    }

    const agenda = this.agendaRepository.create({
      nombre,
      descripcion,
      gestores,
    });

    return this.agendaRepository.save(agenda);
  }

  async findAll(gestorId?: string) {
    if (gestorId) {
      return this.agendaRepository
        .createQueryBuilder('agenda')
        .leftJoinAndSelect('agenda.gestores', 'gestor')
        .where('gestor.id = :gestorId', { gestorId })
        .andWhere('agenda.activa = :activa', { activa: true })
        .getMany();
    }

    return this.agendaRepository.find({
      where: { activa: true },
      relations: ['gestores'],
    });
  }

  async findOne(id: string, gestorId?: string) {
    const agenda = await this.agendaRepository.findOne({
      where: { id },
      relations: ['gestores', 'timeSlots'],
    });

    if (!agenda) {
      throw new NotFoundException('Agenda not found');
    }

    // If gestorId is provided, verify access
    if (gestorId) {
      const hasAccess = agenda.gestores.some((g) => g.id === gestorId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this agenda');
      }
    }

    return agenda;
  }

  async addGestor(agendaId: string, gestorId: string, currentGestorId: string) {
    const agenda = await this.findOne(agendaId, currentGestorId);

    const gestor = await this.gestorRepository.findOne({ where: { id: gestorId } });
    if (!gestor) {
      throw new NotFoundException('Gestor not found');
    }

    // Check if gestor is already in the agenda
    const alreadyAdded = agenda.gestores.some((g) => g.id === gestorId);
    if (alreadyAdded) {
      return agenda;
    }

    agenda.gestores.push(gestor);
    return this.agendaRepository.save(agenda);
  }

  async removeGestor(agendaId: string, gestorId: string, currentGestorId: string) {
    const agenda = await this.findOne(agendaId, currentGestorId);

    // Don't allow removing the last gestor
    if (agenda.gestores.length === 1) {
      throw new ForbiddenException('Cannot remove the last gestor from agenda');
    }

    agenda.gestores = agenda.gestores.filter((g) => g.id !== gestorId);
    return this.agendaRepository.save(agenda);
  }
}
