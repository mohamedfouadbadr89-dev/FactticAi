import { Role } from '@/core/rbac';

/**
 * RolePerspective (v1.0.0)
 * Maps institutional roles to structural dashboard perspectives.
 */

export type PerspectiveMode = 'executive' | 'command';

export const ROLE_PERSPECTIVE_MAP: Record<Role, PerspectiveMode> = {
  owner: 'executive',
  admin: 'command',
  member: 'command',
  viewer: 'executive',
};

export const getPerspectiveForRole = (role: Role): PerspectiveMode => {
  return ROLE_PERSPECTIVE_MAP[role] || 'executive';
};
