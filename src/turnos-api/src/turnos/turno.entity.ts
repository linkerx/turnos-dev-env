import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TimeSlot } from '../time-slots/time-slot.entity';
import { User } from '../users/user.entity';

export enum TurnoStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('turnos')
export class Turno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  timeSlotId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: TurnoStatus,
    default: TurnoStatus.PENDING,
  })
  status: TurnoStatus;

  @Column({ nullable: true })
  notas: string;

  @ManyToOne(() => TimeSlot, (timeSlot) => timeSlot.turnos)
  @JoinColumn({ name: 'timeSlotId' })
  timeSlot: TimeSlot;

  @ManyToOne(() => User, (user) => user.turnos)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
