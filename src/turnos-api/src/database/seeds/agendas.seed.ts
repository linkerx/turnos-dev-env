import { DataSource } from 'typeorm';
import { Agenda } from '../../agendas/agenda.entity';
import { Gestor } from '../../gestores/gestor.entity';

export async function seedAgendas(
  dataSource: DataSource,
  gestores: Gestor[],
) {
  const agendaRepository = dataSource.getRepository(Agenda);

  console.log('🌱 Seeding Agendas...');

  const agendasData = [
    {
      nombre: 'Consultas Cardiología',
      descripcion: 'Agenda para consultas de cardiología',
      activa: true,
      gestores: [gestores[1], gestores[2]], // Dr. González y Dra. López
    },
    {
      nombre: 'Consultas Pediatría',
      descripcion: 'Agenda para consultas pediátricas',
      activa: true,
      gestores: [gestores[3], gestores[4]], // Dr. Sánchez y Dra. Ramírez
    },
    {
      nombre: 'Consultorios Externos',
      descripcion: 'Agenda general para consultorios externos',
      activa: true,
      gestores: [gestores[1], gestores[3]], // Dr. González y Dr. Sánchez
    },
    {
      nombre: 'Emergencias',
      descripcion: 'Agenda para atención de emergencias',
      activa: true,
      gestores: gestores.slice(1), // Todos los gestores excepto el admin
    },
  ];

  const createdAgendas: Agenda[] = [];

  for (const agendaData of agendasData) {
    let agenda = await agendaRepository.findOne({
      where: { nombre: agendaData.nombre },
    });

    if (!agenda) {
      agenda = agendaRepository.create(agendaData);
      agenda = await agendaRepository.save(agenda);
      console.log(`  ✓ Created agenda: ${agenda.nombre}`);
    } else {
      console.log(`  - Agenda already exists: ${agenda.nombre}`);
    }

    createdAgendas.push(agenda);
  }

  console.log('✅ Agendas seed completed!\n');
  return createdAgendas;
}
