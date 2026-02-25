/**
 * External Trust Proof Interface (v4.9.1)
 * Deterministic contract for governance evidence snapshots.
 */
export interface ExternalTrustProof {
  version: string;
  commitHash: string;
  regionId: string;
  healthScore: number;
  timestamp: string;
  signature: string;
  publicKey: string;
}

/**
 * Trust Boundary Violation Exception
 */
export class TrustBoundaryViolation extends Error {
  constructor(message: string) {
    super(`TRUST_BOUNDARY_VIOLATION: ${message}`);
    this.name = 'TrustBoundaryViolation';
  }
}

/**
 * Governance Evidence Violation Exception
 */
export class GovernanceEvidenceViolation extends Error {
  constructor(message: string) {
    super(`GOVERNANCE_EVIDENCE_VIOLATION: ${message}`);
    this.name = 'GovernanceEvidenceViolation';
  }
}
/**
 * Audit Simulation Violation Exception
 */
export class AuditSimulationViolation extends Error {
  constructor(message: string) {
    super(`AUDIT_SIMULATION_VIOLATION: ${message}`);
    this.name = 'AuditSimulationViolation';
  }
}
