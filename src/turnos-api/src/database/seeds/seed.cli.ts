import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { seedRbac } from '../../rbac/seeds/rbac.seed';
import { seedUsers } from './users.seed';
import { seedGestores } from './gestores.seed';
import { seedGrupos } from './grupos.seed';
import { seedAgendas } from './agendas.seed';
import { seedEspacios } from './espacios.seed';
import { seedTurnos } from './turnos.seed';
import { Role } from '../../rbac/entities/role.entity';
import { Permission } from '../../rbac/entities/permission.entity';
import { User } from '../../users/user.entity';
import { Gestor } from '../../gestores/gestor.entity';
import { Agenda } from '../../agendas/agenda.entity';
import { Espacio } from '../../espacios/espacio.entity';
import { Grupo } from '../../grupos/grupo.entity';
import { Turno } from '../../turnos/turno.entity';

// Load environment variables
config();

const configService = new ConfigService();

// Create DataSource
const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_DATABASE', 'turnos_db'),
  entities: [Role, Permission, User, Gestor, Agenda, Espacio, Grupo, Turno],
  synchronize: false,
  logging: false,
});

async function runSeeds() {
  try {
    console.log('🔗 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    console.log('═'.repeat(50));
    console.log('🌱 STARTING DATABASE SEEDING');
    console.log('═'.repeat(50));
    console.log();

    // 1. Seed RBAC (Roles and Permissions)
    await seedRbac(AppDataSource);

    // 2. Seed Users
    const users = await seedUsers(AppDataSource);

    // 3. Seed Gestores
    const gestores = await seedGestores(AppDataSource);

    // 4. Seed Grupos
    const grupos = await seedGrupos(AppDataSource, gestores);

    // 5. Seed Agendas
    const agendas = await seedAgendas(AppDataSource, gestores);

    // 6. Seed Espacios
    const espacios = await seedEspacios(AppDataSource, agendas, gestores, grupos);

    // 7. Seed Turnos
    await seedTurnos(AppDataSource, espacios, users);

    console.log('═'.repeat(50));
    console.log('🎉 ALL SEEDS COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(50));
    console.log();
    console.log('📊 Summary:');
    console.log(`  • Users: ${users.length}`);
    console.log(`  • Gestores: ${gestores.length}`);
    console.log(`  • Grupos: ${grupos.length}`);
    console.log(`  • Agendas: ${agendas.length}`);
    console.log(`  • Espacios: ${espacios.length}`);
    console.log();

    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runSeeds();
