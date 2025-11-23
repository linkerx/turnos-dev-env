import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'view_all_calendars' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Permite ver todos los calendarios de todos los gestores' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'calendar', required: false })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiProperty({ example: 'view_all', required: false })
  @IsString()
  @IsOptional()
  action?: string;
}
