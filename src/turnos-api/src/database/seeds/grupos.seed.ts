import { DataSource } from 'typeorm';
import { Grupo } from '../../grupos/grupo.entity';
import { Gestor } from '../../gestores/gestor.entity';

export async function seedGrupos(
  dataSource: DataSource,
  gestores: Gestor[],
) {
  const grupoRepository = dataSource.getRepository(Grupo);

  console.log('🌱 Seeding Grupos...');

  const gruposData = [
    {
      nombre: 'Cardiología',
      descripcion: 'Grupo de especialistas en cardiología',
      activo: true,
      gestores: [gestores[1], gestores[2]], // Dr. González y Dra. López
    },
    {
      nombre: 'Pediatría',
      descripcion: 'Grupo de pediatras',
      activo: true,
      gestores: [gestores[3], gestores[4]], // Dr. Sánchez y Dra. Ramírez
    },
    {
      nombre: 'Medicina General',
      descripcion: 'Médicos generalistas',
      activo: true,
      gestores: [gestores[1], gestores[3]], // Dr. González y Dr. Sánchez
    },
  ];

  const createdGrupos: Grupo[] = [];

  for (const grupoData of gruposData) {
    let grupo = await grupoRepository.findOne({
      where: { nombre: grupoData.nombre },
    });

    if (!grupo) {
      grupo = grupoRepository.create(grupoData);
      grupo = await grupoRepository.save(grupo);
      console.log(`  ✓ Created grupo: ${grupo.nombre}`);
    } else {
      console.log(`  - Grupo already exists: ${grupo.nombre}`);
    }

    createdGrupos.push(grupo);
  }

  console.log('✅ Grupos seed completed!\n');
  return createdGrupos;
}
