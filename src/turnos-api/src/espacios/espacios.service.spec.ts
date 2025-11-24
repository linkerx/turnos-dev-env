import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EspaciosService } from './espacios.service';
import { Espacio } from './espacio.entity';
import { Agenda } from '../agendas/agenda.entity';
import { Grupo } from '../grupos/grupo.entity';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

describe('EspaciosService', () => {
  let service: EspaciosService;
  let espacioRepository: jest.Mocked<Repository<Espacio>>;
  let agendaRepository: jest.Mocked<Repository<Agenda>>;
  let grupoRepository: jest.Mocked<Repository<Grupo>>;

  const mockGestor = {
    id: 'gestor1',
    nombre: 'Test Gestor',
  };

  const mockAgenda: Partial<Agenda> = {
    id: 'agenda1',
    nombre: 'Test Agenda',
    gestores: [mockGestor as any],
  };

  const mockEspacio: Partial<Espacio> = {
    id: 'espacio1',
    agendaId: 'agenda1',
    gestorId: 'gestor1',
    startTime: new Date('2025-12-01T08:00:00'),
    endTime: new Date('2025-12-01T12:00:00'),
    slotDuration: 30,
    activo: true,
    turnos: [],
  };

  const mockGrupo: Partial<Grupo> = {
    id: 'grupo1',
    nombre: 'Test Grupo',
    activo: true,
    gestores: [mockGestor as any],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EspaciosService,
        {
          provide: getRepositoryToken(Espacio),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Agenda),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Grupo),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EspaciosService>(EspaciosService);
    espacioRepository = module.get(getRepositoryToken(Espacio));
    agendaRepository = module.get(getRepositoryToken(Agenda));
    grupoRepository = module.get(getRepositoryToken(Grupo));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an espacio successfully', async () => {
      const createDto = {
        agendaId: 'agenda1',
        grupoId: null,
        startTime: '2025-12-01T08:00:00',
        endTime: '2025-12-01T12:00:00',
        slotDuration: 30,
      };
      const currentUser = {
        id: 'gestor1',
        userType: 'gestor',
        permissions: ['create_espacio'],
      };

      agendaRepository.findOne.mockResolvedValue(mockAgenda as Agenda);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      espacioRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      espacioRepository.create.mockReturnValue(mockEspacio as Espacio);
      espacioRepository.save.mockResolvedValue(mockEspacio as Espacio);

      const result = await service.create(createDto, currentUser);

      expect(result).toEqual(mockEspacio);
      expect(espacioRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not gestor', async () => {
      const createDto = {
        agendaId: 'agenda1',
        grupoId: null,
        startTime: '2025-12-01T08:00:00',
        endTime: '2025-12-01T12:00:00',
        slotDuration: 30,
      };
      const currentUser = {
        id: 'user1',
        userType: 'user',
        permissions: [],
      };

      await expect(service.create(createDto, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if start time is not before end time', async () => {
      const createDto = {
        agendaId: 'agenda1',
        grupoId: null,
        startTime: '2025-12-01T12:00:00',
        endTime: '2025-12-01T08:00:00',
        slotDuration: 30,
      };
      const currentUser = {
        id: 'gestor1',
        userType: 'gestor',
        permissions: ['create_espacio'],
      };

      await expect(service.create(createDto, currentUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if agenda not found', async () => {
      const createDto = {
        agendaId: 'nonexistent',
        grupoId: null,
        startTime: '2025-12-01T08:00:00',
        endTime: '2025-12-01T12:00:00',
        slotDuration: 30,
      };
      const currentUser = {
        id: 'gestor1',
        userType: 'gestor',
        permissions: ['create_espacio'],
      };

      agendaRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, currentUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if gestor does not have access to agenda', async () => {
      const createDto = {
        agendaId: 'agenda1',
        grupoId: null,
        startTime: '2025-12-01T08:00:00',
        endTime: '2025-12-01T12:00:00',
        slotDuration: 30,
      };
      const currentUser = {
        id: 'gestor2',
        userType: 'gestor',
        permissions: ['create_espacio'],
      };

      agendaRepository.findOne.mockResolvedValue(mockAgenda as Agenda);

      await expect(service.create(createDto, currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should create espacio with grupo', async () => {
      const createDto = {
        agendaId: 'agenda1',
        grupoId: 'grupo1',
        startTime: '2025-12-01T08:00:00',
        endTime: '2025-12-01T12:00:00',
        slotDuration: 30,
      };
      const currentUser = {
        id: 'gestor1',
        userType: 'gestor',
        permissions: ['create_espacio'],
      };

      agendaRepository.findOne.mockResolvedValue(mockAgenda as Agenda);
      grupoRepository.findOne.mockResolvedValue(mockGrupo as Grupo);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      espacioRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      espacioRepository.create.mockReturnValue(mockEspacio as Espacio);
      espacioRepository.save.mockResolvedValue(mockEspacio as Espacio);

      const result = await service.create(createDto, currentUser);

      expect(result).toEqual(mockEspacio);
    });

    it('should throw ConflictException if espacio overlaps', async () => {
      const createDto = {
        agendaId: 'agenda1',
        grupoId: null,
        startTime: '2025-12-01T08:00:00',
        endTime: '2025-12-01T12:00:00',
        slotDuration: 30,
      };
      const currentUser = {
        id: 'gestor1',
        userType: 'gestor',
        permissions: ['create_espacio'],
      };

      agendaRepository.findOne.mockResolvedValue(mockAgenda as Agenda);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEspacio]),
      };
      espacioRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      await expect(service.create(createDto, currentUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByAgenda', () => {
    it('should return espacios for agenda', async () => {
      espacioRepository.find.mockResolvedValue([mockEspacio as Espacio]);

      const result = await service.findByAgenda('agenda1');

      expect(result).toEqual([mockEspacio]);
      expect(espacioRepository.find).toHaveBeenCalledWith({
        where: { agendaId: 'agenda1', activo: true },
        relations: ['gestor', 'grupo', 'grupo.gestores'],
        order: { startTime: 'ASC' },
      });
    });
  });

  describe('findByGestor', () => {
    it('should return espacios for gestor', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEspacio]),
      };

      espacioRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.findByGestor('gestor1');

      expect(result).toEqual([mockEspacio]);
    });
  });

  describe('findAvailableEspacios', () => {
    it('should return available espacios', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEspacio]),
      };

      espacioRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.findAvailableEspacios('agenda1');

      expect(result).toEqual([mockEspacio]);
    });

    it('should filter by date if provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEspacio]),
      };

      espacioRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.findAvailableEspacios(
        'agenda1',
        '2025-12-01',
      );

      expect(result).toEqual([mockEspacio]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(4);
    });
  });

  describe('findOne', () => {
    it('should return espacio by id', async () => {
      espacioRepository.findOne.mockResolvedValue(mockEspacio as Espacio);

      const result = await service.findOne('espacio1');

      expect(result).toEqual(mockEspacio);
    });

    it('should throw NotFoundException if espacio not found', async () => {
      espacioRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete espacio', async () => {
      const currentUser = {
        id: 'gestor1',
        userType: 'gestor',
        permissions: ['delete_espacio'],
      };

      espacioRepository.findOne.mockResolvedValue(mockEspacio as Espacio);
      espacioRepository.save.mockResolvedValue({
        ...mockEspacio,
        activo: false,
      } as Espacio);

      const result = await service.remove('espacio1', currentUser);

      expect(result.activo).toBe(false);
      expect(espacioRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if gestor does not own espacio', async () => {
      const currentUser = {
        id: 'gestor2',
        userType: 'gestor',
        permissions: ['delete_espacio'],
      };

      espacioRepository.findOne.mockResolvedValue(mockEspacio as Espacio);

      await expect(service.remove('espacio1', currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if espacio has confirmed turnos', async () => {
      const espacioWithTurnos = {
        ...mockEspacio,
        turnos: [{ status: 'confirmed' }],
      };
      const currentUser = {
        id: 'gestor1',
        userType: 'gestor',
        permissions: ['delete_espacio'],
      };

      espacioRepository.findOne.mockResolvedValue(
        espacioWithTurnos as Espacio,
      );

      await expect(service.remove('espacio1', currentUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
