import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { User } from '../users/user.entity';
import { Gestor } from '../gestores/gestor.entity';
import { Agenda } from '../agendas/agenda.entity';
import { Espacio } from '../espacios/espacio.entity';
import { Grupo } from '../grupos/grupo.entity';
import { Turno } from '../turnos/turno.entity';

export const testDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT) || 5432,
  username: process.env.TEST_DB_USERNAME || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_DATABASE || 'turnos_test_db',
  entities: [Role, Permission, User, Gestor, Agenda, Espacio, Grupo, Turno],
  synchronize: true,
  dropSchema: true,
  logging: false,
};
