import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendasController } from './agendas.controller';
import { AgendasService } from './agendas.service';
import { Agenda } from './agenda.entity';
import { Gestor } from '../gestores/gestor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agenda, Gestor])],
  controllers: [AgendasController],
  providers: [AgendasService],
  exports: [AgendasService, TypeOrmModule],
})
export class AgendasModule {}
