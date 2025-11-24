import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgendasService } from './agendas.service';
import { Agenda } from './agenda.entity';
import { Gestor } from '../gestores/gestor.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('AgendasService', () => {
  let service: AgendasService;
  let agendaRepository: jest.Mocked<Repository<Agenda>>;
  let gestorRepository: jest.Mocked<Repository<Gestor>>;

  const mockAgenda: Partial<Agenda> = {
    id: '1',
    nombre: 'Test Agenda',
    descripcion: 'Test Description',
    activa: true,
    gestores: [],
  };

  const mockGestor: Partial<Gestor> = {
    id: 'gestor1',
    email: 'gestor@test.com',
    nombre: 'Test Gestor',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendasService,
        {
          provide: getRepositoryToken(Agenda),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
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

    service = module.get<AgendasService>(AgendasService);
    agendaRepository = module.get(getRepositoryToken(Agenda));
    gestorRepository = module.get(getRepositoryToken(Gestor));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an agenda with gestores', async () => {
      const createDto = {
        nombre: 'New Agenda',
        descripcion: 'Description',
        gestorIds: ['gestor1'],
      };
      const currentUser = { id: 'admin1', permissions: ['create_agenda'] };

      gestorRepository.find.mockResolvedValue([mockGestor as Gestor]);
      agendaRepository.create.mockReturnValue(mockAgenda as Agenda);
      agendaRepository.save.mockResolvedValue(mockAgenda as Agenda);

      const result = await service.create(createDto, currentUser);

      expect(gestorRepository.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
      });
      expect(agendaRepository.create).toHaveBeenCalled();
      expect(agendaRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockAgenda);
    });

    it('should throw NotFoundException if gestor not found', async () => {
      const createDto = {
        nombre: 'New Agenda',
        descripcion: 'Description',
        gestorIds: ['nonexistent'],
      };
      const currentUser = { id: 'admin1', permissions: ['create_agenda'] };

      gestorRepository.find.mockResolvedValue([]);

      await expect(service.create(createDto, currentUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all agendas for admin with view_all_agendas', async () => {
      const currentUser = {
        id: 'admin1',
        permissions: ['view_all_agendas'],
      };

      agendaRepository.find.mockResolvedValue([mockAgenda as Agenda]);

      const result = await service.findAll(currentUser);

      expect(agendaRepository.find).toHaveBeenCalledWith({
        where: { activa: true },
        relations: ['gestores'],
      });
      expect(result).toEqual([mockAgenda]);
    });

    it('should return only gestor agendas for gestor role', async () => {
      const currentUser = {
        id: 'gestor1',
        userType: 'gestor',
        permissions: ['view_agendas'],
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAgenda]),
      };

      agendaRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(currentUser);

      expect(result).toEqual([mockAgenda]);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should return empty array for regular users', async () => {
      const currentUser = {
        id: 'user1',
        userType: 'user',
        permissions: [],
      };

      const result = await service.findAll(currentUser);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return agenda for admin with view_all_agendas', async () => {
      const currentUser = {
        id: 'admin1',
        permissions: ['view_all_agendas'],
      };

      agendaRepository.findOne.mockResolvedValue(mockAgenda as Agenda);

      const result = await service.findOne('1', currentUser);

      expect(result).toEqual(mockAgenda);
    });

    it('should return agenda for gestor with access', async () => {
      const currentUser = {
        id: 'gestor1',
        userType: 'gestor',
        permissions: ['view_agendas'],
      };

      const agendaWithGestores = {
        ...mockAgenda,
        gestores: [mockGestor as Gestor],
      };

      agendaRepository.findOne.mockResolvedValue(
        agendaWithGestores as Agenda,
      );

      const result = await service.findOne('1', currentUser);

      expect(result).toEqual(agendaWithGestores);
    });

    it('should throw ForbiddenException for gestor without access', async () => {
      const currentUser = {
        id: 'gestor2',
        userType: 'gestor',
        permissions: ['view_agendas'],
      };

      const agendaWithGestores = {
        ...mockAgenda,
        gestores: [mockGestor as Gestor],
      };

      agendaRepository.findOne.mockResolvedValue(
        agendaWithGestores as Agenda,
      );

      await expect(service.findOne('1', currentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if agenda not found', async () => {
      const currentUser = {
        id: 'admin1',
        permissions: ['view_all_agendas'],
      };

      agendaRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', currentUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addGestor', () => {
    it('should add gestor to agenda', async () => {
      const agendaWithGestores = {
        ...mockAgenda,
        gestores: [],
      };

      agendaRepository.findOne.mockResolvedValue(
        agendaWithGestores as Agenda,
      );
      gestorRepository.findOne.mockResolvedValue(mockGestor as Gestor);
      agendaRepository.save.mockResolvedValue(agendaWithGestores as Agenda);

      const result = await service.addGestor('1', 'gestor1');

      expect(result).toBeDefined();
      expect(agendaRepository.save).toHaveBeenCalled();
    });

    it('should not add gestor if already added', async () => {
      const agendaWithGestores = {
        ...mockAgenda,
        gestores: [mockGestor as Gestor],
      };

      agendaRepository.findOne.mockResolvedValue(
        agendaWithGestores as Agenda,
      );
      gestorRepository.findOne.mockResolvedValue(mockGestor as Gestor);

      const result = await service.addGestor('1', 'gestor1');

      expect(result).toEqual(agendaWithGestores);
      expect(agendaRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if agenda not found', async () => {
      agendaRepository.findOne.mockResolvedValue(null);

      await expect(service.addGestor('nonexistent', 'gestor1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if gestor not found', async () => {
      agendaRepository.findOne.mockResolvedValue(mockAgenda as Agenda);
      gestorRepository.findOne.mockResolvedValue(null);

      await expect(service.addGestor('1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeGestor', () => {
    it('should remove gestor from agenda', async () => {
      const mockGestor2 = { ...mockGestor, id: 'gestor2' };
      const agendaWithGestores = {
        ...mockAgenda,
        gestores: [mockGestor as Gestor, mockGestor2 as Gestor],
      };

      agendaRepository.findOne.mockResolvedValue(
        agendaWithGestores as Agenda,
      );
      agendaRepository.save.mockResolvedValue(agendaWithGestores as Agenda);

      const result = await service.removeGestor('1', 'gestor1');

      expect(result).toBeDefined();
      expect(agendaRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if trying to remove last gestor', async () => {
      const agendaWithGestores = {
        ...mockAgenda,
        gestores: [mockGestor as Gestor],
      };

      agendaRepository.findOne.mockResolvedValue(
        agendaWithGestores as Agenda,
      );

      await expect(service.removeGestor('1', 'gestor1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if agenda not found', async () => {
      agendaRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeGestor('nonexistent', 'gestor1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
