import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnosController } from './turnos.controller';
import { TurnosService } from './turnos.service';
import { Turno } from './turno.entity';
import { Espacio } from '../espacios/espacio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, Espacio])],
  controllers: [TurnosController],
  providers: [TurnosService],
  exports: [TurnosService, TypeOrmModule],
})
export class TurnosModule {}
