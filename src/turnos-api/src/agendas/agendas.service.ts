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

  async create(createAgendaDto: CreateAgendaDto, currentUser: any) {
    const { nombre, descripcion, gestorIds } = createAgendaDto;

    // Verify all gestores exist
    const gestores = await this.gestorRepository.find({
      where: { id: In(gestorIds) },
    });

    if (gestores.length !== gestorIds.length) {
      throw new NotFoundException('One or more gestores not found');
    }

    const agenda = this.agendaRepository.create({
      nombre,
      descripcion,
      gestores,
    });

    return this.agendaRepository.save(agenda);
  }

  async findAll(currentUser: any) {
    const hasViewAllPermission = currentUser.permissions.includes('view_all_agendas');

    // Si tiene permiso view_all_agendas, devolver todas las agendas
    if (hasViewAllPermission) {
      return this.agendaRepository.find({
        where: { activa: true },
        relations: ['gestores'],
      });
    }

    // Si es gestor, solo devolver sus agendas
    if (currentUser.userType === 'gestor') {
      return this.agendaRepository
        .createQueryBuilder('agenda')
        .leftJoinAndSelect('agenda.gestores', 'gestor')
        .where('gestor.id = :gestorId', { gestorId: currentUser.id })
        .andWhere('agenda.activa = :activa', { activa: true })
        .getMany();
    }

    // Usuarios normales no tienen acceso a agendas
    return [];
  }

  async findOne(id: string, currentUser: any) {
    const agenda = await this.agendaRepository.findOne({
      where: { id },
      relations: ['gestores', 'espacios'],
    });

    if (!agenda) {
      throw new NotFoundException('Agenda not found');
    }

    const hasViewAllPermission = currentUser.permissions.includes('view_all_agendas');

    // Si tiene permiso view_all_agendas, permitir acceso
    if (hasViewAllPermission) {
      return agenda;
    }

    // Si es gestor, verificar que esté en la agenda
    if (currentUser.userType === 'gestor') {
      const hasAccess = agenda.gestores.some((g) => g.id === currentUser.id);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this agenda');
      }
      return agenda;
    }

    // Usuarios normales no tienen acceso
    throw new ForbiddenException('You do not have access to this agenda');
  }

  async addGestor(agendaId: string, gestorId: string) {
    const agenda = await this.agendaRepository.findOne({
      where: { id: agendaId },
      relations: ['gestores'],
    });

    if (!agenda) {
      throw new NotFoundException('Agenda not found');
    }

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

  async removeGestor(agendaId: string, gestorId: string) {
    const agenda = await this.agendaRepository.findOne({
      where: { id: agendaId },
      relations: ['gestores'],
    });

    if (!agenda) {
      throw new NotFoundException('Agenda not found');
    }

    // Don't allow removing the last gestor
    if (agenda.gestores.length === 1) {
      throw new ForbiddenException('Cannot remove the last gestor from agenda');
    }

    agenda.gestores = agenda.gestores.filter((g) => g.id !== gestorId);
    return this.agendaRepository.save(agenda);
  }
}
