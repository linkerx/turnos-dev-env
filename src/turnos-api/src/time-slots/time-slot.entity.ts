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
import { Turno } from '../turnos/turno.entity';

@Entity('time_slots')
export class TimeSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  agendaId: string;

  @Column({ type: 'uuid' })
  gestorId: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ type: 'int', comment: 'Duración de cada turno en minutos' })
  slotDuration: number;

  @Column({ default: true })
  activo: boolean;

  @ManyToOne(() => Agenda, (agenda) => agenda.timeSlots)
  @JoinColumn({ name: 'agendaId' })
  agenda: Agenda;

  @ManyToOne(() => Gestor, (gestor) => gestor.timeSlots)
  @JoinColumn({ name: 'gestorId' })
  gestor: Gestor;

  @OneToMany(() => Turno, (turno) => turno.timeSlot)
  turnos: Turno[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
