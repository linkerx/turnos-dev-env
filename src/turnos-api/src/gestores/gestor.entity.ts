import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { TimeSlot } from '../time-slots/time-slot.entity';
import { Agenda } from '../agendas/agenda.entity';

@Entity('gestores')
export class Gestor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  telefono: string;

  @ManyToMany(() => Agenda, (agenda) => agenda.gestores)
  agendas: Agenda[];

  @OneToMany(() => TimeSlot, (timeSlot) => timeSlot.gestor)
  timeSlots: TimeSlot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
