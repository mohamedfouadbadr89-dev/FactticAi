/**
 * Basic RBAC Scaffold
 * 
 * Defines roles and permission check utilities.
 */

export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export const ROLES: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export const hasPermission = (userRole: Role, requiredRole: Role): boolean => {
  return ROLES[userRole] >= ROLES[requiredRole];
};

export const requireRole = (userRole: Role, requiredRole: Role) => {
  if (!hasPermission(userRole, requiredRole)) {
    throw new Error(`Insufficient permissions. Required: ${requiredRole}, Current: ${userRole}`);
  }
};
