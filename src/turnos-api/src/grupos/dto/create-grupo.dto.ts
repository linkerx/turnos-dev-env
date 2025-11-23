import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGrupoDto {
  @ApiProperty({ example: 'Grupo de Atención General' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Grupo de gestores para atención general', required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiProperty({
    example: ['gestor-uuid-1', 'gestor-uuid-2'],
    type: [String],
    description: 'IDs de los gestores que forman parte del grupo'
  })
  @IsArray()
  @IsUUID('4', { each: true })
  gestorIds: string[];
}
