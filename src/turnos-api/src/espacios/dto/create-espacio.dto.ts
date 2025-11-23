import { IsString, IsNotEmpty, IsDateString, IsInt, Min, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEspacioDto {
  @ApiProperty({ example: 'agenda-uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  agendaId: string;

  @ApiProperty({
    example: 'grupo-uuid',
    required: false,
    description: 'Si se especifica, el espacio es compartido por todos los gestores del grupo'
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  grupoId?: string;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2024-01-15T17:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 30, description: 'Duración de cada turno en minutos' })
  @IsInt()
  @Min(15)
  slotDuration: number;
}
