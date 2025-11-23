import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TimeSlot } from '../time-slots/time-slot.entity';
import { Agenda } from '../agendas/agenda.entity';
import { Role } from '../rbac/entities/role.entity';

@Entity('gestores')
export class Gestor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  keycloakId: string; // ID del usuario en Keycloak

  @ManyToOne(() => Role, (role) => role.gestores, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToMany(() => Agenda, (agenda) => agenda.gestores)
  agendas: Agenda[];

  @OneToMany(() => TimeSlot, (timeSlot) => timeSlot.gestor)
  timeSlots: TimeSlot[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
