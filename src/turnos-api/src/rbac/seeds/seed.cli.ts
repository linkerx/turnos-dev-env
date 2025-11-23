import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { seedRbac } from './rbac.seed';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { User } from '../../users/user.entity';
import { Gestor } from '../../gestores/gestor.entity';
import { Agenda } from '../../agendas/agenda.entity';
import { TimeSlot } from '../../time-slots/time-slot.entity';
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
  entities: [Role, Permission, User, Gestor, Agenda, TimeSlot, Turno],
  synchronize: false,
  logging: false,
});

async function runSeed() {
  try {
    console.log('🔗 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    await seedRbac(AppDataSource);

    console.log('🎉 All seeds completed successfully!');
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

runSeed();
