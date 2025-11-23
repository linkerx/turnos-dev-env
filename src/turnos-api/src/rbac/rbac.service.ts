import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { User } from '../users/user.entity';
import { Gestor } from '../gestores/gestor.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Gestor)
    private gestorRepository: Repository<Gestor>,
  ) {}

  // ============ PERMISSIONS ============

  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    const existing = await this.permissionRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Permission '${dto.name}' already exists`);
    }

    const permission = this.permissionRepository.create(dto);
    return this.permissionRepository.save(permission);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findPermissionById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async deletePermission(id: string): Promise<void> {
    const permission = await this.findPermissionById(id);
    await this.permissionRepository.remove(permission);
  }

  // ============ ROLES ============

  async createRole(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Role '${dto.name}' already exists`);
    }

    const role = this.roleRepository.create({
      name: dto.name,
      description: dto.description,
      active: dto.active ?? true,
    });

    if (dto.permissionIds && dto.permissionIds.length > 0) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(dto.permissionIds) },
      });

      if (permissions.length !== dto.permissionIds.length) {
        throw new BadRequestException('Some permission IDs are invalid');
      }

      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }

  async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async updateRole(id: string, dto: Partial<CreateRoleDto>): Promise<Role> {
    const role = await this.findRoleById(id);

    if (dto.name && dto.name !== role.name) {
      const existing = await this.roleRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Role '${dto.name}' already exists`);
      }
      role.name = dto.name;
    }

    if (dto.description) {
      role.description = dto.description;
    }

    if (dto.active !== undefined) {
      role.active = dto.active;
    }

    if (dto.permissionIds) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(dto.permissionIds) },
      });

      if (permissions.length !== dto.permissionIds.length) {
        throw new BadRequestException('Some permission IDs are invalid');
      }

      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);

    // Verificar si hay usuarios o gestores con este rol
    const usersCount = await this.userRepository.count({
      where: { role: { id } },
    });
    const gestoresCount = await this.gestorRepository.count({
      where: { role: { id } },
    });

    if (usersCount > 0 || gestoresCount > 0) {
      throw new BadRequestException(
        `Cannot delete role. It is assigned to ${usersCount + gestoresCount} user(s)`,
      );
    }

    await this.roleRepository.remove(role);
  }

  async addPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    const role = await this.findRoleById(roleId);
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('Some permission IDs are invalid');
    }

    // Agregar solo permisos que no estén ya asignados
    const existingPermissionIds = role.permissions.map((p) => p.id);
    const newPermissions = permissions.filter(
      (p) => !existingPermissionIds.includes(p.id),
    );

    role.permissions = [...role.permissions, ...newPermissions];
    return this.roleRepository.save(role);
  }

  async removePermissionsFromRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    const role = await this.findRoleById(roleId);

    role.permissions = role.permissions.filter(
      (p) => !permissionIds.includes(p.id),
    );

    return this.roleRepository.save(role);
  }

  // ============ ROLE ASSIGNMENT ============

  async assignRoleToUser(
    userId: string,
    roleId: string,
    userType: 'user' | 'gestor',
  ): Promise<User | Gestor> {
    const role = await this.findRoleById(roleId);

    if (userType === 'user') {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      user.role = role;
      return this.userRepository.save(user);
    } else {
      const gestor = await this.gestorRepository.findOne({
        where: { id: userId },
      });
      if (!gestor) {
        throw new NotFoundException(`Gestor with ID ${userId} not found`);
      }
      gestor.role = role;
      return this.gestorRepository.save(gestor);
    }
  }

  // ============ PERMISSION CHECK ============

  async userHasPermission(
    userId: string,
    userType: 'user' | 'gestor',
    permissionName: string,
  ): Promise<boolean> {
    let user: User | Gestor;

    if (userType === 'user') {
      user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['role', 'role.permissions'],
      });
    } else {
      user = await this.gestorRepository.findOne({
        where: { id: userId },
        relations: ['role', 'role.permissions'],
      });
    }

    if (!user || !user.role || !user.role.permissions) {
      return false;
    }

    return user.role.permissions.some((p) => p.name === permissionName);
  }

  async userHasAnyPermission(
    userId: string,
    userType: 'user' | 'gestor',
    permissionNames: string[],
  ): Promise<boolean> {
    for (const permissionName of permissionNames) {
      if (await this.userHasPermission(userId, userType, permissionName)) {
        return true;
      }
    }
    return false;
  }
}
