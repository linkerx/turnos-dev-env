import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { TimeSlot } from '../time-slots/time-slot.entity';
import { Gestor } from '../gestores/gestor.entity';

@Entity('agendas')
export class Agenda {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ default: true })
  activa: boolean;

  @ManyToMany(() => Gestor, (gestor) => gestor.agendas)
  @JoinTable({
    name: 'agenda_gestores',
    joinColumn: { name: 'agenda_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'gestor_id', referencedColumnName: 'id' },
  })
  gestores: Gestor[];

  @OneToMany(() => TimeSlot, (timeSlot) => timeSlot.agenda)
  timeSlots: TimeSlot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
