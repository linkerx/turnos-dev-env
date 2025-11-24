import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/user.entity';
import { Role } from '../../rbac/entities/role.entity';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);

  console.log('🌱 Seeding Users...');

  // Get roles
  const userRole = await roleRepository.findOne({ where: { name: 'user' } });
  const adminRole = await roleRepository.findOne({
    where: { name: 'administrator' },
  });

  if (!userRole || !adminRole) {
    throw new Error('Roles not found. Please run RBAC seed first.');
  }

  const usersData = [
    {
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      nombre: 'Admin Usuario',
      telefono: '+54 9 11 1234-5678',
      role: adminRole,
    },
    {
      email: 'juan.perez@example.com',
      password: await bcrypt.hash('password123', 10),
      nombre: 'Juan Pérez',
      telefono: '+54 9 11 2345-6789',
      role: userRole,
    },
    {
      email: 'maria.garcia@example.com',
      password: await bcrypt.hash('password123', 10),
      nombre: 'María García',
      telefono: '+54 9 11 3456-7890',
      role: userRole,
    },
    {
      email: 'carlos.rodriguez@example.com',
      password: await bcrypt.hash('password123', 10),
      nombre: 'Carlos Rodríguez',
      telefono: '+54 9 11 4567-8901',
      role: userRole,
    },
    {
      email: 'ana.martinez@example.com',
      password: await bcrypt.hash('password123', 10),
      nombre: 'Ana Martínez',
      telefono: '+54 9 11 5678-9012',
      role: userRole,
    },
    {
      email: 'luis.fernandez@example.com',
      password: await bcrypt.hash('password123', 10),
      nombre: 'Luis Fernández',
      telefono: '+54 9 11 6789-0123',
      role: userRole,
    },
  ];

  const createdUsers: User[] = [];

  for (const userData of usersData) {
    let user = await userRepository.findOne({
      where: { email: userData.email },
    });

    if (!user) {
      user = userRepository.create(userData);
      user = await userRepository.save(user);
      console.log(`  ✓ Created user: ${user.email}`);
    } else {
      console.log(`  - User already exists: ${user.email}`);
    }

    createdUsers.push(user);
  }

  console.log('✅ Users seed completed!\n');
  return createdUsers;
}
