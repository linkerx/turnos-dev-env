import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTurnoDto {
  @ApiProperty({ example: 'uuid-timeslot-1' })
  @IsUUID('4')
  timeSlotId: string;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: 'Consulta general', required: false })
  @IsOptional()
  @IsString()
  notas?: string;
}
