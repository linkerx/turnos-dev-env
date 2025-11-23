import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GruposController } from './grupos.controller';
import { GruposService } from './grupos.service';
import { Grupo } from './grupo.entity';
import { Gestor } from '../gestores/gestor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grupo, Gestor])],
  controllers: [GruposController],
  providers: [GruposService],
  exports: [GruposService],
})
export class GruposModule {}
