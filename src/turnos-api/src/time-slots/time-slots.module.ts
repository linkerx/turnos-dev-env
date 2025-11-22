import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeSlotsController } from './time-slots.controller';
import { TimeSlotsService } from './time-slots.service';
import { TimeSlot } from './time-slot.entity';
import { Agenda } from '../agendas/agenda.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeSlot, Agenda])],
  controllers: [TimeSlotsController],
  providers: [TimeSlotsService],
  exports: [TimeSlotsService, TypeOrmModule],
})
export class TimeSlotsModule {}
