import { DataSource } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';

/**
 * Seed data for RBAC (Roles and Permissions)
 * Run this script to initialize the database with default roles and permissions
 */
export async function seedRbac(dataSource: DataSource) {
  const permissionRepository = dataSource.getRepository(Permission);
  const roleRepository = dataSource.getRepository(Role);

  console.log('🌱 Seeding RBAC data...');

  // ============ PERMISSIONS ============
  const permissionsData = [
    // Gestión de Roles y Permisos (Solo Admin)
    {
      name: 'manage_roles',
      description: 'Crear, editar y eliminar roles',
      resource: 'role',
      action: 'manage',
    },
    {
      name: 'manage_permissions',
      description: 'Crear, editar y eliminar permisos',
      resource: 'permission',
      action: 'manage',
    },
    {
      name: 'view_roles',
      description: 'Ver roles del sistema',
      resource: 'role',
      action: 'read',
    },
    {
      name: 'view_permissions',
      description: 'Ver permisos del sistema',
      resource: 'permission',
      action: 'read',
    },

    // Gestión de Agendas
    {
      name: 'create_agenda',
      description: 'Crear agendas',
      resource: 'agenda',
      action: 'create',
    },
    {
      name: 'view_agendas',
      description: 'Ver agendas propias (gestor)',
      resource: 'agenda',
      action: 'read',
    },
    {
      name: 'view_all_agendas',
      description: 'Ver todas las agendas del sistema (admin)',
      resource: 'agenda',
      action: 'read_all',
    },
    {
      name: 'assign_gestores_to_agendas',
      description: 'Asignar y remover gestores de agendas (solo admin)',
      resource: 'agenda',
      action: 'assign_gestores',
    },

    // Gestión de Calendarios (Time Slots)
    {
      name: 'create_time_slot',
      description: 'Crear espacios de tiempo en el calendario',
      resource: 'time_slot',
      action: 'create',
    },
    {
      name: 'view_time_slots',
      description: 'Ver espacios de tiempo',
      resource: 'time_slot',
      action: 'read',
    },
    {
      name: 'view_own_calendar',
      description: 'Ver el calendario propio (gestor)',
      resource: 'calendar',
      action: 'read_own',
    },
    {
      name: 'view_all_calendars',
      description: 'Ver todos los calendarios de todos los gestores (admin)',
      resource: 'calendar',
      action: 'read_all',
    },
    {
      name: 'delete_time_slot',
      description: 'Eliminar espacios de tiempo',
      resource: 'time_slot',
      action: 'delete',
    },

    // Gestión de Turnos
    {
      name: 'create_turno',
      description: 'Crear turnos',
      resource: 'turno',
      action: 'create',
    },
    {
      name: 'view_turnos',
      description: 'Ver turnos',
      resource: 'turno',
      action: 'read',
    },
    {
      name: 'cancel_turno',
      description: 'Cancelar turnos',
      resource: 'turno',
      action: 'cancel',
    },
    {
      name: 'manage_turnos',
      description: 'Gestionar todos los turnos (admin)',
      resource: 'turno',
      action: 'manage',
    },

    // Gestión de Usuarios
    {
      name: 'view_users',
      description: 'Ver usuarios del sistema',
      resource: 'user',
      action: 'read',
    },
    {
      name: 'manage_users',
      description: 'Gestionar usuarios (crear, editar, eliminar)',
      resource: 'user',
      action: 'manage',
    },
  ];

  console.log('Creating permissions...');
  const createdPermissions: Permission[] = [];

  for (const permData of permissionsData) {
    let permission = await permissionRepository.findOne({
      where: { name: permData.name },
    });

    if (!permission) {
      permission = permissionRepository.create(permData);
      permission = await permissionRepository.save(permission);
      console.log(`  ✓ Created permission: ${permission.name}`);
    } else {
      console.log(`  - Permission already exists: ${permission.name}`);
    }

    createdPermissions.push(permission);
  }

  // ============ ROLES ============

  // Helper function to get permissions by names
  const getPermissionsByNames = (names: string[]) => {
    return createdPermissions.filter((p) => names.includes(p.name));
  };

  // ROL: Administrador (todos los permisos)
  console.log('\nCreating roles...');

  const adminPermissions = createdPermissions; // Todos los permisos
  let adminRole = await roleRepository.findOne({
    where: { name: 'administrator' },
  });

  if (!adminRole) {
    adminRole = roleRepository.create({
      name: 'administrator',
      description: 'Administrador del sistema con acceso completo',
      active: true,
      permissions: adminPermissions,
    });
    await roleRepository.save(adminRole);
    console.log(`  ✓ Created role: ${adminRole.name} (${adminPermissions.length} permissions)`);
  } else {
    console.log(`  - Role already exists: ${adminRole.name}`);
  }

  // ROL: Gestor (permisos de gestor)
  const gestorPermissions = getPermissionsByNames([
    'view_agendas',
    'create_agenda',
    'create_time_slot',
    'view_time_slots',
    'view_own_calendar',
    'delete_time_slot',
    'view_turnos',
  ]);

  let gestorRole = await roleRepository.findOne({
    where: { name: 'gestor' },
  });

  if (!gestorRole) {
    gestorRole = roleRepository.create({
      name: 'gestor',
      description: 'Gestor de agendas y calendarios',
      active: true,
      permissions: gestorPermissions,
    });
    await roleRepository.save(gestorRole);
    console.log(`  ✓ Created role: ${gestorRole.name} (${gestorPermissions.length} permissions)`);
  } else {
    console.log(`  - Role already exists: ${gestorRole.name}`);
  }

  // ROL: Usuario (permisos básicos)
  const userPermissions = getPermissionsByNames([
    'view_agendas',
    'view_time_slots',
    'create_turno',
    'view_turnos',
    'cancel_turno',
  ]);

  let userRole = await roleRepository.findOne({
    where: { name: 'user' },
  });

  if (!userRole) {
    userRole = roleRepository.create({
      name: 'user',
      description: 'Usuario básico del sistema',
      active: true,
      permissions: userPermissions,
    });
    await roleRepository.save(userRole);
    console.log(`  ✓ Created role: ${userRole.name} (${userPermissions.length} permissions)`);
  } else {
    console.log(`  - Role already exists: ${userRole.name}`);
  }

  console.log('\n✅ RBAC seed completed successfully!\n');
}
