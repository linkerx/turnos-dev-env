import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Agenda } from '../agendas/agenda.entity';
import { Gestor } from '../gestores/gestor.entity';
import { Grupo } from '../grupos/grupo.entity';
import { Turno } from '../turnos/turno.entity';

@Entity('espacios')
export class Espacio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  agendaId: string;

  @Column({ type: 'uuid' })
  gestorId: string; // Gestor que creó el espacio

  @Column({ type: 'uuid', nullable: true })
  grupoId: string; // Si es un espacio de grupo

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'int', comment: 'Duración de cada turno en minutos' })
  slotDuration: number;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => Agenda, (agenda) => agenda.espacios)
  @JoinColumn({ name: 'agendaId' })
  agenda: Agenda;

  @ManyToOne(() => Gestor, (gestor) => gestor.espacios)
  @JoinColumn({ name: 'gestorId' })
  gestor: Gestor;

  @ManyToOne(() => Grupo, { eager: true, nullable: true })
  @JoinColumn({ name: 'grupoId' })
  grupo: Grupo;

  @OneToMany(() => Turno, (turno) => turno.espacio)
  turnos: Turno[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
