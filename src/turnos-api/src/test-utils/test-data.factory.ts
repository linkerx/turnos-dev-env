import * as bcrypt from 'bcrypt';
import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { User } from '../users/user.entity';
import { Gestor } from '../gestores/gestor.entity';
import { Agenda } from '../agendas/agenda.entity';
import { Espacio } from '../espacios/espacio.entity';
import { Grupo } from '../grupos/grupo.entity';
import { Turno, TurnoStatus } from '../turnos/turno.entity';

export class TestDataFactory {
  static async createPermission(
    overrides: Partial<Permission> = {},
  ): Promise<Permission> {
    const permission = new Permission();
    permission.name = overrides.name || 'test_permission';
    permission.description = overrides.description || 'Test permission';
    permission.resource = overrides.resource || 'test';
    permission.action = overrides.action || 'read';
    return Object.assign(permission, overrides);
  }

  static async createRole(
    overrides: Partial<Role> = {},
    permissions: Permission[] = [],
  ): Promise<Role> {
    const role = new Role();
    role.name = overrides.name || 'test_role';
    role.description = overrides.description || 'Test role';
    role.active = overrides.active !== undefined ? overrides.active : true;
    role.permissions = permissions;
    return Object.assign(role, overrides);
  }

  static async createUser(
    overrides: Partial<User> = {},
    role?: Role,
  ): Promise<User> {
    const user = new User();
    user.email = overrides.email || `test${Date.now()}@example.com`;
    user.password = overrides.password
      ? await bcrypt.hash(overrides.password, 10)
      : await bcrypt.hash('password123', 10);
    user.nombre = overrides.nombre || 'Test User';
    user.telefono = overrides.telefono || '+54 9 11 1234-5678';
    if (role) user.role = role;
    return Object.assign(user, overrides);
  }

  static async createGestor(
    overrides: Partial<Gestor> = {},
    role?: Role,
  ): Promise<Gestor> {
    const gestor = new Gestor();
    gestor.email = overrides.email || `gestor${Date.now()}@example.com`;
    gestor.password = overrides.password
      ? await bcrypt.hash(overrides.password, 10)
      : await bcrypt.hash('password123', 10);
    gestor.nombre = overrides.nombre || 'Test Gestor';
    gestor.telefono = overrides.telefono || '+54 9 11 2234-5678';
    if (role) gestor.role = role;
    return Object.assign(gestor, overrides);
  }

  static createAgenda(
    overrides: Partial<Agenda> = {},
    gestores: Gestor[] = [],
  ): Agenda {
    const agenda = new Agenda();
    agenda.nombre = overrides.nombre || 'Test Agenda';
    agenda.descripcion = overrides.descripcion || 'Test agenda description';
    agenda.activa = overrides.activa !== undefined ? overrides.activa : true;
    agenda.gestores = gestores;
    return Object.assign(agenda, overrides);
  }

  static createGrupo(
    overrides: Partial<Grupo> = {},
    gestores: Gestor[] = [],
  ): Grupo {
    const grupo = new Grupo();
    grupo.nombre = overrides.nombre || 'Test Grupo';
    grupo.descripcion = overrides.descripcion || 'Test grupo description';
    grupo.activo = overrides.activo !== undefined ? overrides.activo : true;
    grupo.gestores = gestores;
    return Object.assign(grupo, overrides);
  }

  static createEspacio(overrides: Partial<Espacio> = {}): Espacio {
    const espacio = new Espacio();
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // +4 hours

    espacio.startTime = overrides.startTime || startTime;
    espacio.endTime = overrides.endTime || endTime;
    espacio.slotDuration = overrides.slotDuration || 30;
    espacio.activo = overrides.activo !== undefined ? overrides.activo : true;

    if (overrides.agendaId) espacio.agendaId = overrides.agendaId;
    if (overrides.gestorId) espacio.gestorId = overrides.gestorId;
    if (overrides.grupoId) espacio.grupoId = overrides.grupoId;

    return Object.assign(espacio, overrides);
  }

  static createTurno(overrides: Partial<Turno> = {}): Turno {
    const turno = new Turno();
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // +30 minutes

    turno.startTime = overrides.startTime || startTime;
    turno.endTime = overrides.endTime || endTime;
    turno.status = overrides.status || TurnoStatus.PENDING;
    turno.notas = overrides.notas || null;

    if (overrides.espacioId) turno.espacioId = overrides.espacioId;
    if (overrides.userId) turno.userId = overrides.userId;

    return Object.assign(turno, overrides);
  }
}
