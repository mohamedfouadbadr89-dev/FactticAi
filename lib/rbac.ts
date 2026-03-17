/**
 * RBAC Guards
 * 
 * Deterministic role checking for Level 1.
 */

export type Role = 'owner' | 'admin' | 'analyst' | 'viewer' | 'member';

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 3,
  admin: 2,
  analyst: 1,
  member: 1,  // 'member' is the DB-stored equivalent of 'analyst'
  viewer: 0,
};

export const hasRequiredRole = (currentRole: Role, requiredRole: Role): boolean => {
  const current = ROLE_HIERARCHY[currentRole] ?? 0;
  const required = ROLE_HIERARCHY[requiredRole] ?? 0;
  return current >= required;
};

export const authorize = (currentRole: Role, requiredRole: Role) => {
  if (!hasRequiredRole(currentRole, requiredRole)) {
    throw new Error(`Forbidden: Required role ${requiredRole}, current role ${currentRole}`);
  }
};
