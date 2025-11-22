import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateAgendaDto {
  @ApiProperty({ example: 'Consultorio Médico' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'Agenda para consultas médicas generales', required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    example: ['uuid-gestor-1', 'uuid-gestor-2'],
    description: 'IDs de gestores que tendrán acceso a esta agenda',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  gestorIds: string[];
}
