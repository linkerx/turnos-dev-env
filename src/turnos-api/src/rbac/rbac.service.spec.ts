import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RbacService } from './rbac.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { User } from '../users/user.entity';
import { Gestor } from '../gestores/gestor.entity';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('RbacService', () => {
  let service: RbacService;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let gestorRepository: jest.Mocked<Repository<Gestor>>;

  const mockPermission: Partial<Permission> = {
    id: 'perm1',
    name: 'test_permission',
    description: 'Test permission',
    resource: 'test',
    action: 'read',
  };

  const mockRole: Partial<Role> = {
    id: 'role1',
    name: 'test_role',
    description: 'Test role',
    active: true,
    permissions: [mockPermission as Permission],
  };

  const mockUser: Partial<User> = {
    id: 'user1',
    email: 'user@test.com',
    role: mockRole as Role,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        {
          provide: getRepositoryToken(Role),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Gestor),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
    roleRepository = module.get(getRepositoryToken(Role));
    permissionRepository = module.get(getRepositoryToken(Permission));
    userRepository = module.get(getRepositoryToken(User));
    gestorRepository = module.get(getRepositoryToken(Gestor));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Permission Management', () => {
    describe('createPermission', () => {
      it('should create a permission', async () => {
        const dto = {
          name: 'new_permission',
          description: 'New permission',
          resource: 'test',
          action: 'create',
        };

        permissionRepository.findOne.mockResolvedValue(null);
        permissionRepository.create.mockReturnValue(mockPermission as Permission);
        permissionRepository.save.mockResolvedValue(mockPermission as Permission);

        const result = await service.createPermission(dto);

        expect(result).toEqual(mockPermission);
        expect(permissionRepository.save).toHaveBeenCalled();
      });

      it('should throw ConflictException if permission exists', async () => {
        const dto = {
          name: 'existing_permission',
          description: 'Existing permission',
          resource: 'test',
          action: 'read',
        };

        permissionRepository.findOne.mockResolvedValue(mockPermission as Permission);

        await expect(service.createPermission(dto)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('findAllPermissions', () => {
      it('should return all permissions', async () => {
        permissionRepository.find.mockResolvedValue([mockPermission as Permission]);

        const result = await service.findAllPermissions();

        expect(result).toEqual([mockPermission]);
      });
    });

    describe('findPermissionById', () => {
      it('should return a permission', async () => {
        permissionRepository.findOne.mockResolvedValue(mockPermission as Permission);

        const result = await service.findPermissionById('perm1');

        expect(result).toEqual(mockPermission);
      });

      it('should throw NotFoundException if not found', async () => {
        permissionRepository.findOne.mockResolvedValue(null);

        await expect(service.findPermissionById('nonexistent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('deletePermission', () => {
      it('should delete a permission', async () => {
        permissionRepository.findOne.mockResolvedValue(mockPermission as Permission);
        permissionRepository.remove.mockResolvedValue(mockPermission as Permission);

        await service.deletePermission('perm1');

        expect(permissionRepository.remove).toHaveBeenCalled();
      });
    });
  });

  describe('Role Management', () => {
    describe('createRole', () => {
      it('should create a role', async () => {
        const dto = {
          name: 'new_role',
          description: 'New role',
          active: true,
          permissionIds: ['perm1'],
        };

        roleRepository.findOne.mockResolvedValue(null);
        permissionRepository.find.mockResolvedValue([mockPermission as Permission]);
        roleRepository.create.mockReturnValue(mockRole as Role);
        roleRepository.save.mockResolvedValue(mockRole as Role);

        const result = await service.createRole(dto);

        expect(result).toEqual(mockRole);
      });

      it('should throw ConflictException if role exists', async () => {
        const dto = {
          name: 'existing_role',
          description: 'Existing role',
          active: true,
        };

        roleRepository.findOne.mockResolvedValue(mockRole as Role);

        await expect(service.createRole(dto)).rejects.toThrow(
          ConflictException,
        );
      });

      it('should throw BadRequestException for invalid permission IDs', async () => {
        const dto = {
          name: 'new_role',
          description: 'New role',
          active: true,
          permissionIds: ['perm1', 'invalid'],
        };

        roleRepository.findOne.mockResolvedValue(null);
        permissionRepository.find.mockResolvedValue([mockPermission as Permission]);

        await expect(service.createRole(dto)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('findAllRoles', () => {
      it('should return all roles', async () => {
        roleRepository.find.mockResolvedValue([mockRole as Role]);

        const result = await service.findAllRoles();

        expect(result).toEqual([mockRole]);
      });
    });

    describe('findRoleById', () => {
      it('should return a role', async () => {
        roleRepository.findOne.mockResolvedValue(mockRole as Role);

        const result = await service.findRoleById('role1');

        expect(result).toEqual(mockRole);
      });

      it('should throw NotFoundException if not found', async () => {
        roleRepository.findOne.mockResolvedValue(null);

        await expect(service.findRoleById('nonexistent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('updateRole', () => {
      it('should update a role', async () => {
        const dto = {
          description: 'Updated description',
        };

        roleRepository.findOne.mockResolvedValue(mockRole as Role);
        roleRepository.save.mockResolvedValue({
          ...mockRole,
          ...dto,
        } as Role);

        const result = await service.updateRole('role1', dto);

        expect(result.description).toBe(dto.description);
      });
    });

    describe('deleteRole', () => {
      it('should delete a role', async () => {
        roleRepository.findOne.mockResolvedValue(mockRole as Role);
        userRepository.count.mockResolvedValue(0);
        gestorRepository.count.mockResolvedValue(0);
        roleRepository.remove.mockResolvedValue(mockRole as Role);

        await service.deleteRole('role1');

        expect(roleRepository.remove).toHaveBeenCalled();
      });

      it('should throw BadRequestException if role is assigned to users', async () => {
        roleRepository.findOne.mockResolvedValue(mockRole as Role);
        userRepository.count.mockResolvedValue(1);

        await expect(service.deleteRole('role1')).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('addPermissionsToRole', () => {
      it('should add permissions to role', async () => {
        const newPerm = { id: 'perm2', name: 'new_perm' };

        roleRepository.findOne.mockResolvedValue(mockRole as Role);
        permissionRepository.find.mockResolvedValue([newPerm as Permission]);
        roleRepository.save.mockResolvedValue(mockRole as Role);

        const result = await service.addPermissionsToRole('role1', ['perm2']);

        expect(result).toBeDefined();
      });
    });

    describe('removePermissionsFromRole', () => {
      it('should remove permissions from role', async () => {
        roleRepository.findOne.mockResolvedValue(mockRole as Role);
        roleRepository.save.mockResolvedValue({
          ...mockRole,
          permissions: [],
        } as Role);

        const result = await service.removePermissionsFromRole('role1', ['perm1']);

        expect(result).toBeDefined();
      });
    });
  });

  describe('Role Assignment', () => {
    describe('assignRoleToUser', () => {
      it('should assign role to user', async () => {
        roleRepository.findOne.mockResolvedValue(mockRole as Role);
        userRepository.findOne.mockResolvedValue(mockUser as User);
        userRepository.save.mockResolvedValue(mockUser as User);

        const result = await service.assignRoleToUser('user1', 'role1', 'user');

        expect(result).toEqual(mockUser);
      });

      it('should throw NotFoundException if user not found', async () => {
        roleRepository.findOne.mockResolvedValue(mockRole as Role);
        userRepository.findOne.mockResolvedValue(null);

        await expect(
          service.assignRoleToUser('nonexistent', 'role1', 'user'),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Permission Check', () => {
    describe('userHasPermission', () => {
      it('should return true if user has permission', async () => {
        const userWithRole = {
          ...mockUser,
          role: {
            ...mockRole,
            permissions: [mockPermission as Permission],
          },
        };
        userRepository.findOne.mockResolvedValue(userWithRole as User);

        const result = await service.userHasPermission(
          'user1',
          'user',
          'test_permission',
        );

        expect(result).toBe(true);
      });

      it('should return false if user does not have permission', async () => {
        const userWithRole = {
          ...mockUser,
          role: {
            ...mockRole,
            permissions: [mockPermission as Permission],
          },
        };
        userRepository.findOne.mockResolvedValue(userWithRole as User);

        const result = await service.userHasPermission(
          'user1',
          'user',
          'nonexistent_permission',
        );

        expect(result).toBe(false);
      });

      it('should return false if user not found', async () => {
        userRepository.findOne.mockResolvedValue(null);

        const result = await service.userHasPermission(
          'nonexistent',
          'user',
          'test_permission',
        );

        expect(result).toBe(false);
      });
    });

    describe('userHasAnyPermission', () => {
      it('should return true if user has any of the permissions', async () => {
        const userWithRole = {
          ...mockUser,
          role: {
            ...mockRole,
            permissions: [mockPermission as Permission],
          },
        };
        userRepository.findOne.mockResolvedValue(userWithRole as User);

        const result = await service.userHasAnyPermission('user1', 'user', [
          'test_permission',
          'other_permission',
        ]);

        expect(result).toBe(true);
      });

      it('should return false if user has none of the permissions', async () => {
        const userWithRole = {
          ...mockUser,
          role: {
            ...mockRole,
            permissions: [mockPermission as Permission],
          },
        };
        userRepository.findOne.mockResolvedValue(userWithRole as User);

        const result = await service.userHasAnyPermission('user1', 'user', [
          'nonexistent1',
          'nonexistent2',
        ]);

        expect(result).toBe(false);
      });
    });
  });
});
