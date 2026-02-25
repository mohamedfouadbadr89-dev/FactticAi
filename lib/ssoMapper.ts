import { Role } from './rbac';

export interface ExternalClaims {
  sub: string;
  org_id: string; // From custom SAML/OIDC claim
  role: string;   // From custom SAML/OIDC claim
}

export interface InternalIdentity {
  user_id: string;
  org_id: string;
  role: Role;
}

/**
 * Enterprise SSO Claim Mapper (v3.2)
 * 
 * Deterministically maps external JWT claims from SAML/OIDC providers
 * to Facttic's internal identity and permission model.
 */
export class SSOMapper {
  /**
   * Maps external claims to internal identity.
   * Ensures deterministic alignment.
   */
  static mapClaims(claims: ExternalClaims): InternalIdentity {
    // 1. Map Subject to User ID
    const user_id = claims.sub;

    // 2. Map Organization Claim
    const org_id = claims.org_id;

    // 3. Map Role Claim to Internal RBAC
    let role: Role = 'member';
    if (claims.role === 'owner' || claims.role === 'admin') {
      role = claims.role as Role;
    } else if (claims.role === 'viewer') {
      role = 'viewer';
    }

    return {
      user_id,
      org_id,
      role
    };
  }

  /**
   * Validates that the mapped identity is structurally sound.
   */
  static validateIdentity(identity: InternalIdentity): boolean {
    return !!(identity.user_id && identity.org_id && identity.role);
  }
}
