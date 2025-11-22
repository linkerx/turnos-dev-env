import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum UserRole {
  USER = 'user',
  GESTOR = 'gestor',
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: '+54911234567', required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @IsEnum(UserRole)
  role: UserRole;
}
