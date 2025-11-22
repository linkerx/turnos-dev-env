import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';

export class CreateTimeSlotDto {
  @ApiProperty({ example: 'uuid-agenda-1' })
  @IsUUID('4')
  agendaId: string;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2024-01-15T17:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({
    example: 30,
    description: 'Duration of each turno slot in minutes',
    minimum: 5,
    maximum: 240,
  })
  @IsInt()
  @Min(5)
  @Max(240)
  slotDuration: number;
}
