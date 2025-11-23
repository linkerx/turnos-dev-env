import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { GruposService } from './grupos.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('Grupos')
@Controller('grupos')
@UseGuards(KeycloakAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Post()
  @RequirePermissions('manage_grupos')
  @ApiOperation({ summary: 'Create a new grupo (Admin only)' })
  @ApiResponse({ status: 201, description: 'Grupo created successfully' })
  create(@Body() createGrupoDto: CreateGrupoDto) {
    return this.gruposService.create(createGrupoDto);
  }

  @Get()
  @RequirePermissions('view_grupos')
  @ApiOperation({ summary: 'Get all grupos' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive grupos',
  })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.gruposService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @RequirePermissions('view_grupos')
  @ApiOperation({ summary: 'Get grupo by ID' })
  findOne(@Param('id') id: string) {
    return this.gruposService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('manage_grupos')
  @ApiOperation({ summary: 'Update grupo (Admin only)' })
  update(@Param('id') id: string, @Body() updateGrupoDto: UpdateGrupoDto) {
    return this.gruposService.update(id, updateGrupoDto);
  }

  @Delete(':id')
  @RequirePermissions('manage_grupos')
  @ApiOperation({ summary: 'Delete (deactivate) grupo (Admin only)' })
  remove(@Param('id') id: string) {
    return this.gruposService.remove(id);
  }

  @Post(':id/gestores')
  @RequirePermissions('manage_grupos')
  @ApiOperation({ summary: 'Add gestores to grupo (Admin only)' })
  addGestores(@Param('id') id: string, @Body() body: { gestorIds: string[] }) {
    return this.gruposService.addGestores(id, body.gestorIds);
  }

  @Delete(':id/gestores')
  @RequirePermissions('manage_grupos')
  @ApiOperation({ summary: 'Remove gestores from grupo (Admin only)' })
  removeGestores(
    @Param('id') id: string,
    @Body() body: { gestorIds: string[] },
  ) {
    return this.gruposService.removeGestores(id, body.gestorIds);
  }
}
