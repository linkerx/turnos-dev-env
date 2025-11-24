import { DataSource } from 'typeorm';
import { Turno, TurnoStatus } from '../../turnos/turno.entity';
import { Espacio } from '../../espacios/espacio.entity';
import { User } from '../../users/user.entity';

export async function seedTurnos(
  dataSource: DataSource,
  espacios: Espacio[],
  users: User[],
) {
  const turnoRepository = dataSource.getRepository(Turno);

  console.log('🌱 Seeding Turnos...');

  const turnosData = [];

  // Crear turnos para algunos espacios
  // Tomar los primeros 10 espacios y crear 2-3 turnos por espacio
  const espaciosParaTurnos = espacios.slice(0, 10);
  const regularUsers = users.filter((u) => u.role.name === 'user');

  let userIndex = 0;

  for (const espacio of espaciosParaTurnos) {
    const start = new Date(espacio.startTime);
    const end = new Date(espacio.endTime);
    const duration = espacio.slotDuration;

    // Crear 2-3 turnos por espacio
    const numTurnos = Math.floor(Math.random() * 2) + 2; // 2 o 3 turnos

    for (let i = 0; i < numTurnos; i++) {
      const turnoStart = new Date(start);
      turnoStart.setMinutes(start.getMinutes() + i * duration);

      const turnoEnd = new Date(turnoStart);
      turnoEnd.setMinutes(turnoStart.getMinutes() + duration);

      // Verificar que no exceda el tiempo del espacio
      if (turnoEnd > end) break;

      // Rotar entre usuarios
      const user = regularUsers[userIndex % regularUsers.length];
      userIndex++;

      // Asignar estados aleatorios
      const statuses = [
        TurnoStatus.PENDING,
        TurnoStatus.CONFIRMED,
        TurnoStatus.COMPLETED,
      ];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      turnosData.push({
        espacioId: espacio.id,
        userId: user.id,
        startTime: turnoStart,
        endTime: turnoEnd,
        status,
        notas:
          status === TurnoStatus.COMPLETED
            ? 'Consulta realizada correctamente'
            : null,
      });
    }
  }

  const createdTurnos: Turno[] = [];

  for (const turnoData of turnosData) {
    const turno = turnoRepository.create(turnoData);
    const savedTurno = await turnoRepository.save(turno);
    createdTurnos.push(savedTurno);
  }

  console.log(`  ✓ Created ${createdTurnos.length} turnos`);
  console.log('✅ Turnos seed completed!\n');
  return createdTurnos;
}
