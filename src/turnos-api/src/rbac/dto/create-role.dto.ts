import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'administrator' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Administrador del sistema con todos los permisos' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({
    example: ['permission-uuid-1', 'permission-uuid-2'],
    required: false,
    type: [String]
  })
  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}
