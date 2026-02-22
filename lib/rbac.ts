/**
 * RBAC Guards
 * 
 * Deterministic role checking for Level 1.
 */

export type Role = 'owner' | 'admin' | 'member';

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export const hasRequiredRole = (currentRole: Role, requiredRole: Role): boolean => {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
};

export const authorize = (currentRole: Role, requiredRole: Role) => {
  if (!hasRequiredRole(currentRole, requiredRole)) {
    throw new Error(`Forbidden: Required role ${requiredRole}, current role ${currentRole}`);
  }
};
