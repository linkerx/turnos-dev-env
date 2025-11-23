import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for a route.
 * User must have at least ONE of the specified permissions.
 *
 * @param permissions - List of permission names (user needs at least one)
 *
 * @example
 * @RequirePermissions('manage_roles', 'view_roles')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
