import { supabaseServer } from '@/lib/supabaseServer';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PRINCIPAL REGISTRY
//
// Internal system jobs (cron, diagnostics, simulators) cannot authenticate
// through Supabase Auth because they are server-side processes with no user
// session. They must still call GovernancePipeline.execute() to produce
// forensic governance events for health and observability purposes.
//
// SECURITY MODEL:
//   The bypass is safe ONLY because user_id for these callers originates from
//   server-side constants in trusted application code, never from an API
//   request body. A user cannot supply a system identity through an API call
//   because:
//     1. All authenticated user routes read user_id from session.user.id
//        (a Supabase-verified JWT claim), not from the request payload.
//     2. This allowlist is explicit and fixed — any new system identity
//        requires a deliberate code change with review. An open-ended
//        startsWith("system-") check would allow any caller to self-declare
//        a system identity; this allowlist prevents that.
//
// AUDIT:
//   Every system principal execution is written to audit_logs with action
//   SYSTEM_PIPELINE_EXECUTION so system-initiated governance runs are fully
//   traceable in the forensic ledger.
//
// To add a new system principal:
//   1. Add the exact string value to SYSTEM_PRINCIPALS below
//   2. Add documentation in docs/security/FACTTIC_SECURITY_THREAT_MODEL_v1.md
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PRINCIPALS = new Set<string>([
  'system-cron-health',   // Cron health monitor — verifies pipeline liveness on a schedule
  'system-diagnostic',    // System report API — pipeline latency and end-to-end health checks
  'system-simulator',     // Simulation runner — executes synthetic governance scenarios
  'system-audit',         // Offline audit scripts — generateEvidenceBundle, certifyDeterminism
]);

/**
 * Returns true if user_id is a known internal system principal.
 * System principals bypass the org_members membership check because they
 * are server-side processes with no Supabase Auth session.
 *
 * IMPORTANT: This check is only safe when user_id originates from a
 * server-side constant, never from user-supplied API request body data.
 */
export function isSystemPrincipal(user_id: string): boolean {
  return SYSTEM_PRINCIPALS.has(user_id);
}

/**
 * Zero-Trust Organization Authorization Guard (v2.0)
 *
 * For human users: verifies org_members membership via direct DB lookup.
 * For system principals: bypasses membership check with forensic audit log.
 *
 * CORE PRINCIPLE: org_id must NEVER be trusted from the API payload.
 * Callers must supply org_id from verified session context or server config.
 */
export async function authorizeOrgAccess(
  user_id: string,
  org_id: string
): Promise<void> {
  if (!user_id || !org_id) {
    throw new AuthorizationError(
      'MISSING_IDENTITY',
      'user_id and org_id are both required for Zero-Trust authorization.',
      user_id,
      org_id
    );
  }

  // ── System Principal Fast Path ─────────────────────────────────────────────
  // Known internal system jobs bypass the org_members check.
  // A forensic audit entry is written in place of the membership verification.
  if (isSystemPrincipal(user_id)) {
    // Fire-and-forget audit entry — system runs are always traceable
    void supabaseServer.from('audit_logs').insert({
      org_id,
      action: 'SYSTEM_PIPELINE_EXECUTION',
      metadata: {
        system_identity: true,
        user_id,
        org_id,
        timestamp: new Date().toISOString(),
      },
    });
    // Allow execution to proceed — no org_members lookup needed
    return;
  }
  // ── End System Principal Fast Path ─────────────────────────────────────────

  // ── Human User Path: org_members verification ─────────────────────────────
  const { data, error } = await supabaseServer
    .from('org_members')
    .select('id')
    .eq('user_id', user_id)
    .eq('org_id', org_id)
    .maybeSingle();

  if (error) {
    throw new AuthorizationError(
      'AUTHORIZATION_DB_ERROR',
      `Database error during org membership check: ${error.message}`,
      user_id,
      org_id
    );
  }

  if (!data) {
    throw new AuthorizationError(
      'CROSS_TENANT_ACCESS_DENIED',
      `User [${user_id}] is not a member of organization [${org_id}]. Cross-tenant access attempt blocked.`,
      user_id,
      org_id
    );
  }
}

/**
 * Structured error class for authorization failures.
 * Carries a machine-readable `code` for downstream audit logging.
 */
export class AuthorizationError extends Error {
  public readonly code: string;
  public readonly user_id: string;
  public readonly org_id: string;

  constructor(code: string, message: string, user_id: string, org_id: string) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
    this.user_id = user_id;
    this.org_id = org_id;
  }
}
