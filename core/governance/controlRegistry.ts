/**
 * Institutional Control Registry (v5.0)
 * 
 * CORE PRINCIPLE: Deterministic Oversight.
 * Defines the formal control set for Pre-SOC2 Type I readiness.
 */

export interface ControlEntry {
  id: string;
  domain: 'AC' | 'CM' | 'IR' | 'DR' | 'SDLC';
  title: string;
  description: string;
  owner: string;
  status: 'ACTIVE' | 'PENDING' | 'RETIRED';
}

export const CONTROL_REGISTRY: ControlEntry[] = [
  {
    id: 'AC-01',
    domain: 'AC',
    title: 'Role-Based Access Control',
    description: 'Enforcement of least-privilege via deterministic RBAC module.',
    owner: 'CISO',
    status: 'ACTIVE'
  },
  {
    id: 'CM-01',
    domain: 'CM',
    title: 'Code Review & Approval',
    description: 'Mandatory peer review and cryptographic sign-off for all production merges.',
    owner: 'VP_ENGINEERING',
    status: 'ACTIVE'
  },
  {
    id: 'IR-01',
    domain: 'IR',
    title: 'Automated Incident Detection',
    description: 'Real-time alerting for integrity desync and sovereign breaches.',
    owner: 'SRE_LEAD',
    status: 'ACTIVE'
  },
  {
    id: 'DR-01',
    domain: 'DR',
    title: 'Sovereign Failover',
    description: 'Automated cross-region replication and standby activation logic.',
    owner: 'INFRA_ARCHITECT',
    status: 'ACTIVE'
  },
  {
    id: 'SDLC-01',
    domain: 'SDLC',
    title: 'Automated Policy Hardening',
    description: 'CI/CD pipeline enforcement of security and governance manifests.',
    owner: 'DEVOPS_LEAD',
    status: 'ACTIVE'
  }
];
