import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GruposService } from './grupos.service';
import { Grupo } from './grupo.entity';
import { Gestor } from '../gestores/gestor.entity';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('GruposService', () => {
  let service: GruposService;
  let grupoRepository: jest.Mocked<Repository<Grupo>>;
  let gestorRepository: jest.Mocked<Repository<Gestor>>;

  const mockGestor: Partial<Gestor> = {
    id: 'gestor1',
    email: 'gestor@test.com',
    nombre: 'Test Gestor',
  };

  const mockGrupo: Partial<Grupo> = {
    id: 'grupo1',
    nombre: 'Test Grupo',
    descripcion: 'Test description',
    activo: true,
    gestores: [mockGestor as Gestor],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GruposService,
        {
          provide: getRepositoryToken(Grupo),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Gestor),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GruposService>(GruposService);
    grupoRepository = module.get(getRepositoryToken(Grupo));
    gestorRepository = module.get(getRepositoryToken(Gestor));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a grupo successfully', async () => {
      const createDto = {
        nombre: 'New Grupo',
        descripcion: 'Description',
        activo: true,
        gestorIds: ['gestor1'],
      };

      grupoRepository.findOne.mockResolvedValue(null);
      gestorRepository.find.mockResolvedValue([mockGestor as Gestor]);
      grupoRepository.create.mockReturnValue(mockGrupo as Grupo);
      grupoRepository.save.mockResolvedValue(mockGrupo as Grupo);

      const result = await service.create(createDto);

      expect(result).toEqual(mockGrupo);
      expect(grupoRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if grupo name already exists', async () => {
      const createDto = {
        nombre: 'Existing Grupo',
        descripcion: 'Description',
        activo: true,
        gestorIds: ['gestor1'],
      };

      grupoRepository.findOne.mockResolvedValue(mockGrupo as Grupo);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if no gestores provided', async () => {
      const createDto = {
        nombre: 'New Grupo',
        descripcion: 'Description',
        activo: true,
        gestorIds: [],
      };

      grupoRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if gestores are invalid', async () => {
      const createDto = {
        nombre: 'New Grupo',
        descripcion: 'Description',
        activo: true,
        gestorIds: ['gestor1', 'gestor2'],
      };

      grupoRepository.findOne.mockResolvedValue(null);
      gestorRepository.find.mockResolvedValue([mockGestor as Gestor]);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all active grupos', async () => {
      grupoRepository.find.mockResolvedValue([mockGrupo as Grupo]);

      const result = await service.findAll();

      expect(result).toEqual([mockGrupo]);
      expect(grupoRepository.find).toHaveBeenCalledWith({
        where: { activo: true },
        relations: ['gestores'],
        order: { nombre: 'ASC' },
      });
    });

    it('should return all grupos including inactive when specified', async () => {
      grupoRepository.find.mockResolvedValue([mockGrupo as Grupo]);

      const result = await service.findAll(true);

      expect(result).toEqual([mockGrupo]);
      expect(grupoRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['gestores'],
        order: { nombre: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a grupo by id', async () => {
      grupoRepository.findOne.mockResolvedValue(mockGrupo as Grupo);

      const result = await service.findOne('grupo1');

      expect(result).toEqual(mockGrupo);
    });

    it('should throw NotFoundException if grupo not found', async () => {
      grupoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a grupo successfully', async () => {
      const updateDto = {
        nombre: 'Updated Grupo',
        descripcion: 'Updated description',
      };

      grupoRepository.findOne.mockResolvedValueOnce(mockGrupo as Grupo);
      grupoRepository.findOne.mockResolvedValueOnce(null);
      grupoRepository.save.mockResolvedValue({
        ...mockGrupo,
        ...updateDto,
      } as Grupo);

      const result = await service.update('grupo1', updateDto);

      expect(result.nombre).toBe(updateDto.nombre);
      expect(grupoRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if new name already exists', async () => {
      const updateDto = {
        nombre: 'Existing Grupo',
      };

      grupoRepository.findOne.mockResolvedValueOnce(mockGrupo as Grupo);
      grupoRepository.findOne.mockResolvedValueOnce({
        id: 'different-id',
      } as Grupo);

      await expect(service.update('grupo1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if trying to remove all gestores', async () => {
      const updateDto = {
        gestorIds: [],
      };

      grupoRepository.findOne.mockResolvedValue(mockGrupo as Grupo);

      await expect(service.update('grupo1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a grupo', async () => {
      grupoRepository.findOne.mockResolvedValue(mockGrupo as Grupo);
      grupoRepository.save.mockResolvedValue({
        ...mockGrupo,
        activo: false,
      } as Grupo);

      const result = await service.remove('grupo1');

      expect(result.activo).toBe(false);
      expect(grupoRepository.save).toHaveBeenCalled();
    });
  });

  describe('addGestores', () => {
    it('should add gestores to grupo', async () => {
      const newGestor = { id: 'gestor2', nombre: 'New Gestor' };

      grupoRepository.findOne.mockResolvedValue(mockGrupo as Grupo);
      gestorRepository.find.mockResolvedValue([newGestor as Gestor]);
      grupoRepository.save.mockResolvedValue(mockGrupo as Grupo);

      const result = await service.addGestores('grupo1', ['gestor2']);

      expect(result).toBeDefined();
      expect(grupoRepository.save).toHaveBeenCalled();
    });

    it('should not add duplicate gestores', async () => {
      grupoRepository.findOne.mockResolvedValue(mockGrupo as Grupo);
      gestorRepository.find.mockResolvedValue([mockGestor as Gestor]);
      grupoRepository.save.mockResolvedValue(mockGrupo as Grupo);

      const result = await service.addGestores('grupo1', ['gestor1']);

      expect(result).toBeDefined();
    });
  });

  describe('removeGestores', () => {
    it('should remove gestores from grupo', async () => {
      const grupoWithMultipleGestores = {
        ...mockGrupo,
        gestores: [
          mockGestor as Gestor,
          { id: 'gestor2', nombre: 'Gestor 2' } as Gestor,
        ],
      };

      grupoRepository.findOne.mockResolvedValue(
        grupoWithMultipleGestores as Grupo,
      );
      grupoRepository.save.mockResolvedValue(grupoWithMultipleGestores as Grupo);

      const result = await service.removeGestores('grupo1', ['gestor1']);

      expect(result).toBeDefined();
      expect(grupoRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if trying to remove all gestores', async () => {
      const grupoWithOneGestor = {
        ...mockGrupo,
        gestores: [mockGestor as Gestor],
      };
      grupoRepository.findOne.mockResolvedValue(grupoWithOneGestor as Grupo);

      await expect(
        service.removeGestores('grupo1', ['gestor1']),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
