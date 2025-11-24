import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Gestor } from '../../gestores/gestor.entity';
import { Role } from '../../rbac/entities/role.entity';

export async function seedGestores(dataSource: DataSource) {
  const gestorRepository = dataSource.getRepository(Gestor);
  const roleRepository = dataSource.getRepository(Role);

  console.log('🌱 Seeding Gestores...');

  // Get gestor role
  const gestorRole = await roleRepository.findOne({
    where: { name: 'gestor' },
  });
  const adminRole = await roleRepository.findOne({
    where: { name: 'administrator' },
  });

  if (!gestorRole || !adminRole) {
    throw new Error('Roles not found. Please run RBAC seed first.');
  }

  const gestoresData = [
    {
      email: 'gestor.admin@example.com',
      password: await bcrypt.hash('gestor123', 10),
      nombre: 'Gestor Admin',
      telefono: '+54 9 11 1111-1111',
      role: adminRole,
    },
    {
      email: 'dr.gonzalez@clinica.com',
      password: await bcrypt.hash('password123', 10),
      nombre: 'Dr. Roberto González',
      telefono: '+54 9 11 2222-2222',
      role: gestorRole,
    },
    {
      email: 'dra.lopez@clinica.com',
      password: await bcrypt.hash('password123', 10),
      nombre: 'Dra. Laura López',
      telefono: '+54 9 11 3333-3333',
      role: gestorRole,
    },
    {
      email: 'dr.sanchez@clinica.com',
      password: await bcrypt.hash('password123', 10),
      nombre: 'Dr. Jorge Sánchez',
      telefono: '+54 9 11 4444-4444',
      role: gestorRole,
    },
    {
      email: 'dra.ramirez@clinica.com',
      password: await bcrypt.hash('password123', 10),
      nombre: 'Dra. Patricia Ramírez',
      telefono: '+54 9 11 5555-5555',
      role: gestorRole,
    },
  ];

  const createdGestores: Gestor[] = [];

  for (const gestorData of gestoresData) {
    let gestor = await gestorRepository.findOne({
      where: { email: gestorData.email },
    });

    if (!gestor) {
      gestor = gestorRepository.create(gestorData);
      gestor = await gestorRepository.save(gestor);
      console.log(`  ✓ Created gestor: ${gestor.email}`);
    } else {
      console.log(`  - Gestor already exists: ${gestor.email}`);
    }

    createdGestores.push(gestor);
  }

  console.log('✅ Gestores seed completed!\n');
  return createdGestores;
}
