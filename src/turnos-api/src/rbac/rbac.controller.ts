import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { KeycloakAuthGuard } from '../auth/guards/keycloak-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('RBAC')
@Controller('rbac')
@UseGuards(KeycloakAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ============ PERMISSIONS ============

  @Post('permissions')
  @RequirePermissions('manage_permissions')
  @ApiOperation({ summary: 'Create a new permission (Admin only)' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.rbacService.createPermission(dto);
  }

  @Get('permissions')
  @RequirePermissions('manage_permissions', 'view_permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  findAllPermissions() {
    return this.rbacService.findAllPermissions();
  }

  @Get('permissions/:id')
  @RequirePermissions('manage_permissions', 'view_permissions')
  @ApiOperation({ summary: 'Get permission by ID' })
  findPermission(@Param('id') id: string) {
    return this.rbacService.findPermissionById(id);
  }

  @Delete('permissions/:id')
  @RequirePermissions('manage_permissions')
  @ApiOperation({ summary: 'Delete a permission (Admin only)' })
  deletePermission(@Param('id') id: string) {
    return this.rbacService.deletePermission(id);
  }

  // ============ ROLES ============

  @Post('roles')
  @RequirePermissions('manage_roles')
  @ApiOperation({ summary: 'Create a new role (Admin only)' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @Get('roles')
  @RequirePermissions('manage_roles', 'view_roles')
  @ApiOperation({ summary: 'Get all roles' })
  findAllRoles() {
    return this.rbacService.findAllRoles();
  }

  @Get('roles/:id')
  @RequirePermissions('manage_roles', 'view_roles')
  @ApiOperation({ summary: 'Get role by ID' })
  findRole(@Param('id') id: string) {
    return this.rbacService.findRoleById(id);
  }

  @Put('roles/:id')
  @RequirePermissions('manage_roles')
  @ApiOperation({ summary: 'Update a role (Admin only)' })
  updateRole(@Param('id') id: string, @Body() dto: Partial<CreateRoleDto>) {
    return this.rbacService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @RequirePermissions('manage_roles')
  @ApiOperation({ summary: 'Delete a role (Admin only)' })
  deleteRole(@Param('id') id: string) {
    return this.rbacService.deleteRole(id);
  }

  // ============ ROLE-PERMISSION MANAGEMENT ============

  @Post('roles/:roleId/permissions')
  @RequirePermissions('manage_roles')
  @ApiOperation({ summary: 'Add permissions to a role (Admin only)' })
  addPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body() body: { permissionIds: string[] },
  ) {
    return this.rbacService.addPermissionsToRole(roleId, body.permissionIds);
  }

  @Delete('roles/:roleId/permissions')
  @RequirePermissions('manage_roles')
  @ApiOperation({ summary: 'Remove permissions from a role (Admin only)' })
  removePermissionsFromRole(
    @Param('roleId') roleId: string,
    @Body() body: { permissionIds: string[] },
  ) {
    return this.rbacService.removePermissionsFromRole(
      roleId,
      body.permissionIds,
    );
  }

  // ============ ROLE ASSIGNMENT ============

  @Post('users/:userId/role')
  @RequirePermissions('manage_roles')
  @ApiOperation({ summary: 'Assign role to a user (Admin only)' })
  assignRoleToUser(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.rbacService.assignRoleToUser(userId, dto.roleId, 'user');
  }

  @Post('gestores/:gestorId/role')
  @RequirePermissions('manage_roles')
  @ApiOperation({ summary: 'Assign role to a gestor (Admin only)' })
  assignRoleToGestor(
    @Param('gestorId') gestorId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.rbacService.assignRoleToUser(gestorId, dto.roleId, 'gestor');
  }
}
