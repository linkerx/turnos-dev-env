import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnosService } from './turnos.service';
import { Turno, TurnoStatus } from './turno.entity';
import { Espacio } from '../espacios/espacio.entity';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

describe('TurnosService', () => {
  let service: TurnosService;
  let turnoRepository: jest.Mocked<Repository<Turno>>;
  let espacioRepository: jest.Mocked<Repository<Espacio>>;

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

  const mockTurno: Partial<Turno> = {
    id: 'turno1',
    espacioId: 'espacio1',
    userId: 'user1',
    startTime: new Date('2025-12-01T09:00:00'),
    endTime: new Date('2025-12-01T09:30:00'),
    status: TurnoStatus.PENDING,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnosService,
        {
          provide: getRepositoryToken(Turno),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Espacio),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TurnosService>(TurnosService);
    turnoRepository = module.get(getRepositoryToken(Turno));
    espacioRepository = module.get(getRepositoryToken(Espacio));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a turno successfully', async () => {
      const createDto = {
        espacioId: 'espacio1',
        startTime: '2025-12-01T09:00:00',
        notas: 'Test notes',
      };
      const userId = 'user1';

      espacioRepository.findOne.mockResolvedValue(mockEspacio as Espacio);
      turnoRepository.findOne.mockResolvedValue(null);
      turnoRepository.create.mockReturnValue(mockTurno as Turno);
      turnoRepository.save.mockResolvedValue(mockTurno as Turno);

      const result = await service.create(createDto, userId);

      expect(result).toEqual(mockTurno);
      expect(turnoRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if espacio not found', async () => {
      const createDto = {
        espacioId: 'nonexistent',
        startTime: '2025-12-01T09:00:00',
      };

      espacioRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 'user1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if espacio is not active', async () => {
      const inactiveEspacio = { ...mockEspacio, activo: false };
      const createDto = {
        espacioId: 'espacio1',
        startTime: '2025-12-01T09:00:00',
      };

      espacioRepository.findOne.mockResolvedValue(inactiveEspacio as Espacio);

      await expect(service.create(createDto, 'user1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if start time is outside espacio bounds', async () => {
      const createDto = {
        espacioId: 'espacio1',
        startTime: '2025-12-01T13:00:00', // After espacio end time
      };

      espacioRepository.findOne.mockResolvedValue(mockEspacio as Espacio);

      await expect(service.create(createDto, 'user1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if turno slot is already taken', async () => {
      const createDto = {
        espacioId: 'espacio1',
        startTime: '2025-12-01T09:00:00',
      };

      espacioRepository.findOne.mockResolvedValue(mockEspacio as Espacio);
      turnoRepository.findOne.mockResolvedValue(mockTurno as Turno);

      await expect(service.create(createDto, 'user1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByUser', () => {
    it('should return all turnos for a user', async () => {
      turnoRepository.find.mockResolvedValue([mockTurno as Turno]);

      const result = await service.findByUser('user1');

      expect(result).toEqual([mockTurno]);
      expect(turnoRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        relations: ['espacio', 'espacio.gestor', 'espacio.agenda'],
        order: { startTime: 'ASC' },
      });
    });
  });

  describe('findByGestor', () => {
    it('should return all turnos for a gestor', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTurno]),
      };

      turnoRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.findByGestor('gestor1');

      expect(result).toEqual([mockTurno]);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a turno by id', async () => {
      turnoRepository.findOne.mockResolvedValue(mockTurno as Turno);

      const result = await service.findOne('turno1');

      expect(result).toEqual(mockTurno);
    });

    it('should throw NotFoundException if turno not found', async () => {
      turnoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('confirm', () => {
    it('should confirm a turno', async () => {
      const turnoWithEspacio = {
        ...mockTurno,
        espacio: mockEspacio,
      };

      turnoRepository.findOne.mockResolvedValue(
        turnoWithEspacio as Turno,
      );
      turnoRepository.save.mockResolvedValue({
        ...turnoWithEspacio,
        status: TurnoStatus.CONFIRMED,
      } as Turno);

      const result = await service.confirm('turno1', 'gestor1');

      expect(result.status).toBe(TurnoStatus.CONFIRMED);
      expect(turnoRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if gestor does not own espacio', async () => {
      const turnoWithEspacio = {
        ...mockTurno,
        espacio: mockEspacio,
      };

      turnoRepository.findOne.mockResolvedValue(
        turnoWithEspacio as Turno,
      );

      await expect(service.confirm('turno1', 'wrongGestor')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if turno is cancelled', async () => {
      const cancelledTurno = {
        ...mockTurno,
        status: TurnoStatus.CANCELLED,
        espacio: mockEspacio,
      };

      turnoRepository.findOne.mockResolvedValue(cancelledTurno as Turno);

      await expect(service.confirm('turno1', 'gestor1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('cancel', () => {
    it('should allow user to cancel their own turno', async () => {
      const turnoWithEspacio = {
        ...mockTurno,
        espacio: mockEspacio,
      };

      turnoRepository.findOne.mockResolvedValue(
        turnoWithEspacio as Turno,
      );
      turnoRepository.save.mockResolvedValue({
        ...turnoWithEspacio,
        status: TurnoStatus.CANCELLED,
      } as Turno);

      const result = await service.cancel('turno1', 'user1', 'user');

      expect(result.status).toBe(TurnoStatus.CANCELLED);
    });

    it('should throw ForbiddenException if user tries to cancel another user turno', async () => {
      const turnoWithEspacio = {
        ...mockTurno,
        espacio: mockEspacio,
      };

      turnoRepository.findOne.mockResolvedValue(
        turnoWithEspacio as Turno,
      );

      await expect(
        service.cancel('turno1', 'wrongUser', 'user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow gestor to cancel turno in their espacio', async () => {
      const turnoWithEspacio = {
        ...mockTurno,
        userId: 'user1',
        espacio: mockEspacio,
      };

      turnoRepository.findOne.mockResolvedValue(
        turnoWithEspacio as Turno,
      );
      turnoRepository.save.mockResolvedValue({
        ...turnoWithEspacio,
        status: TurnoStatus.CANCELLED,
      } as Turno);

      const result = await service.cancel('turno1', 'gestor1', 'gestor');

      expect(result.status).toBe(TurnoStatus.CANCELLED);
    });

    it('should throw ConflictException if turno is completed', async () => {
      const completedTurno = {
        ...mockTurno,
        status: TurnoStatus.COMPLETED,
        espacio: mockEspacio,
      };

      turnoRepository.findOne.mockResolvedValue(completedTurno as Turno);

      await expect(
        service.cancel('turno1', 'user1', 'user'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('complete', () => {
    it('should complete a confirmed turno', async () => {
      const confirmedTurno = {
        ...mockTurno,
        status: TurnoStatus.CONFIRMED,
        espacio: mockEspacio,
      };

      turnoRepository.findOne.mockResolvedValue(confirmedTurno as Turno);
      turnoRepository.save.mockResolvedValue({
        ...confirmedTurno,
        status: TurnoStatus.COMPLETED,
      } as Turno);

      const result = await service.complete('turno1', 'gestor1');

      expect(result.status).toBe(TurnoStatus.COMPLETED);
    });

    it('should throw ForbiddenException if gestor does not own espacio', async () => {
      const turnoWithEspacio = {
        ...mockTurno,
        status: TurnoStatus.CONFIRMED,
        espacio: mockEspacio,
      };

      turnoRepository.findOne.mockResolvedValue(
        turnoWithEspacio as Turno,
      );

      await expect(service.complete('turno1', 'wrongGestor')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if turno is not confirmed', async () => {
      const pendingTurno = {
        ...mockTurno,
        status: TurnoStatus.PENDING,
        espacio: mockEspacio,
      };

      turnoRepository.findOne.mockResolvedValue(pendingTurno as Turno);

      await expect(service.complete('turno1', 'gestor1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOverlappingEspacios', () => {
    it('should find overlapping espacios', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockEspacio]),
      };

      espacioRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.findOverlappingEspacios(
        'agenda1',
        '2025-12-01T09:00:00',
      );

      expect(result).toEqual([mockEspacio]);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });
  });
});
