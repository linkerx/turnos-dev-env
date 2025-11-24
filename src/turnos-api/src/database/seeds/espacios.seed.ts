import { DataSource } from 'typeorm';
import { Espacio } from '../../espacios/espacio.entity';
import { Agenda } from '../../agendas/agenda.entity';
import { Gestor } from '../../gestores/gestor.entity';
import { Grupo } from '../../grupos/grupo.entity';

export async function seedEspacios(
  dataSource: DataSource,
  agendas: Agenda[],
  gestores: Gestor[],
  grupos: Grupo[],
) {
  const espacioRepository = dataSource.getRepository(Espacio);

  console.log('🌱 Seeding Espacios...');

  // Crear fechas para la próxima semana
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const espaciosData = [];

  // Espacios individuales para cada gestor
  for (let day = 0; day < 5; day++) {
    // Lunes a Viernes
    const date = new Date(nextWeek);
    date.setDate(nextWeek.getDate() + day);

    // Dr. González - Cardiología (mañana)
    espaciosData.push({
      agendaId: agendas[0].id, // Consultas Cardiología
      gestorId: gestores[1].id,
      grupoId: null,
      startTime: new Date(date.setHours(8, 0, 0, 0)),
      endTime: new Date(date.setHours(12, 0, 0, 0)),
      slotDuration: 30,
      activo: true,
    });

    // Dra. López - Cardiología (tarde)
    espaciosData.push({
      agendaId: agendas[0].id,
      gestorId: gestores[2].id,
      grupoId: null,
      startTime: new Date(date.setHours(14, 0, 0, 0)),
      endTime: new Date(date.setHours(18, 0, 0, 0)),
      slotDuration: 30,
      activo: true,
    });

    // Dr. Sánchez - Pediatría (mañana)
    espaciosData.push({
      agendaId: agendas[1].id, // Consultas Pediatría
      gestorId: gestores[3].id,
      grupoId: null,
      startTime: new Date(date.setHours(9, 0, 0, 0)),
      endTime: new Date(date.setHours(13, 0, 0, 0)),
      slotDuration: 20,
      activo: true,
    });

    // Dra. Ramírez - Pediatría (tarde)
    espaciosData.push({
      agendaId: agendas[1].id,
      gestorId: gestores[4].id,
      grupoId: null,
      startTime: new Date(date.setHours(15, 0, 0, 0)),
      endTime: new Date(date.setHours(19, 0, 0, 0)),
      slotDuration: 20,
      activo: true,
    });
  }

  // Espacio de grupo para Cardiología (sábado)
  const saturday = new Date(nextWeek);
  saturday.setDate(nextWeek.getDate() + 5);
  espaciosData.push({
    agendaId: agendas[0].id,
    gestorId: gestores[1].id,
    grupoId: grupos[0].id, // Grupo Cardiología
    startTime: new Date(saturday.setHours(9, 0, 0, 0)),
    endTime: new Date(saturday.setHours(13, 0, 0, 0)),
    slotDuration: 30,
    activo: true,
  });

  // Espacio de grupo para Pediatría (sábado)
  espaciosData.push({
    agendaId: agendas[1].id,
    gestorId: gestores[3].id,
    grupoId: grupos[1].id, // Grupo Pediatría
    startTime: new Date(saturday.setHours(10, 0, 0, 0)),
    endTime: new Date(saturday.setHours(14, 0, 0, 0)),
    slotDuration: 20,
    activo: true,
  });

  const createdEspacios: Espacio[] = [];

  for (const espacioData of espaciosData) {
    const espacio = espacioRepository.create(espacioData);
    const savedEspacio = await espacioRepository.save(espacio);
    createdEspacios.push(savedEspacio);
  }

  console.log(`  ✓ Created ${createdEspacios.length} espacios`);
  console.log('✅ Espacios seed completed!\n');
  return createdEspacios;
}
