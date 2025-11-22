import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gestor } from './gestor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Gestor])],
  exports: [TypeOrmModule],
})
export class GestoresModule {}
