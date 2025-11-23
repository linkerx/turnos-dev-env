import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Gestor } from '../gestores/gestor.entity';

@Entity('grupos')
export class Grupo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @ManyToMany(() => Gestor, (gestor) => gestor.grupos, { eager: true })
  @JoinTable({
    name: 'grupo_gestores',
    joinColumn: { name: 'grupo_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'gestor_id', referencedColumnName: 'id' },
  })
  gestores: Gestor[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
