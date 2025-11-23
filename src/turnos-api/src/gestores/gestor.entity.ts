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
import { Espacio } from '../espacios/espacio.entity';
import { Agenda } from '../agendas/agenda.entity';
import { Role } from '../rbac/entities/role.entity';
import { Grupo } from '../grupos/grupo.entity';

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

  @ManyToMany(() => Grupo, (grupo) => grupo.gestores)
  grupos: Grupo[];

  @OneToMany(() => Espacio, (espacio) => espacio.gestor)
  espacios: Espacio[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
