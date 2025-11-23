import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EspaciosController } from './espacios.controller';
import { EspaciosService } from './espacios.service';
import { Espacio } from './espacio.entity';
import { Agenda } from '../agendas/agenda.entity';
import { Grupo } from '../grupos/grupo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Espacio, Agenda, Grupo])],
  controllers: [EspaciosController],
  providers: [EspaciosService],
  exports: [EspaciosService],
})
export class EspaciosModule {}
