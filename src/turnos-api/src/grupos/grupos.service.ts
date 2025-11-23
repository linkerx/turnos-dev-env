import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Grupo } from './grupo.entity';
import { Gestor } from '../gestores/gestor.entity';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';

@Injectable()
export class GruposService {
  constructor(
    @InjectRepository(Grupo)
    private grupoRepository: Repository<Grupo>,
    @InjectRepository(Gestor)
    private gestorRepository: Repository<Gestor>,
  ) {}

  async create(createGrupoDto: CreateGrupoDto) {
    const { nombre, descripcion, activo, gestorIds } = createGrupoDto;

    // Check for duplicate name
    const existing = await this.grupoRepository.findOne({
      where: { nombre },
    });

    if (existing) {
      throw new ConflictException(`Grupo with name '${nombre}' already exists`);
    }

    // Validate gestores exist
    if (!gestorIds || gestorIds.length === 0) {
      throw new BadRequestException('At least one gestor is required');
    }

    const gestores = await this.gestorRepository.find({
      where: { id: In(gestorIds) },
    });

    if (gestores.length !== gestorIds.length) {
      throw new BadRequestException('Some gestor IDs are invalid');
    }

    const grupo = this.grupoRepository.create({
      nombre,
      descripcion,
      activo: activo ?? true,
      gestores,
    });

    return this.grupoRepository.save(grupo);
  }

  async findAll(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { activo: true };
    return this.grupoRepository.find({
      where,
      relations: ['gestores'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string) {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: ['gestores'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }

    return grupo;
  }

  async update(id: string, updateGrupoDto: UpdateGrupoDto) {
    const grupo = await this.findOne(id);

    if (updateGrupoDto.nombre && updateGrupoDto.nombre !== grupo.nombre) {
      const existing = await this.grupoRepository.findOne({
        where: { nombre: updateGrupoDto.nombre },
      });
      if (existing) {
        throw new ConflictException(
          `Grupo with name '${updateGrupoDto.nombre}' already exists`,
        );
      }
      grupo.nombre = updateGrupoDto.nombre;
    }

    if (updateGrupoDto.descripcion !== undefined) {
      grupo.descripcion = updateGrupoDto.descripcion;
    }

    if (updateGrupoDto.activo !== undefined) {
      grupo.activo = updateGrupoDto.activo;
    }

    if (updateGrupoDto.gestorIds) {
      if (updateGrupoDto.gestorIds.length === 0) {
        throw new BadRequestException('At least one gestor is required');
      }

      const gestores = await this.gestorRepository.find({
        where: { id: In(updateGrupoDto.gestorIds) },
      });

      if (gestores.length !== updateGrupoDto.gestorIds.length) {
        throw new BadRequestException('Some gestor IDs are invalid');
      }

      grupo.gestores = gestores;
    }

    return this.grupoRepository.save(grupo);
  }

  async remove(id: string) {
    const grupo = await this.findOne(id);

    // Soft delete by deactivating
    grupo.activo = false;
    return this.grupoRepository.save(grupo);
  }

  async addGestores(id: string, gestorIds: string[]) {
    const grupo = await this.findOne(id);

    const gestores = await this.gestorRepository.find({
      where: { id: In(gestorIds) },
    });

    if (gestores.length !== gestorIds.length) {
      throw new BadRequestException('Some gestor IDs are invalid');
    }

    // Add only new gestores
    const existingIds = grupo.gestores.map((g) => g.id);
    const newGestores = gestores.filter((g) => !existingIds.includes(g.id));

    grupo.gestores = [...grupo.gestores, ...newGestores];
    return this.grupoRepository.save(grupo);
  }

  async removeGestores(id: string, gestorIds: string[]) {
    const grupo = await this.findOne(id);

    // Don't allow removing all gestores
    const remainingGestores = grupo.gestores.filter(
      (g) => !gestorIds.includes(g.id),
    );

    if (remainingGestores.length === 0) {
      throw new BadRequestException(
        'Cannot remove all gestores from grupo. At least one is required.',
      );
    }

    grupo.gestores = remainingGestores;
    return this.grupoRepository.save(grupo);
  }
}
