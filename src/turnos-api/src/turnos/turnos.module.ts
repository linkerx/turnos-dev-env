import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnosController } from './turnos.controller';
import { TurnosService } from './turnos.service';
import { Turno } from './turno.entity';
import { TimeSlot } from '../time-slots/time-slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, TimeSlot])],
  controllers: [TurnosController],
  providers: [TurnosService],
  exports: [TurnosService, TypeOrmModule],
})
export class TurnosModule {}
