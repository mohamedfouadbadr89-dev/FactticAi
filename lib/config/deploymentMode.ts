/**
 * Phase 42 — Enterprise Deployment Mode Engine
 * Declares the three supported deployment modes and exposes helpers
 * for computing compliance profiles and regional constraints.
 */

export type DeploymentMode = 'SAAS' | 'VPC' | 'SELF_HOSTED'
export type DataResidency = 'US' | 'EU' | 'APAC' | 'CUSTOM'

export interface DeploymentConfig {
  mode: DeploymentMode
  region: string
  data_residency: DataResidency
}

export interface ComplianceProfile {
  soc2:       boolean
  gdpr:       boolean
  hipaa:      boolean
  iso27001:   boolean
  privateVpc: boolean
  auditLogs:  boolean
  description: string
}

// ── Mode metadata ─────────────────────────────────────────────────────────────

export const DEPLOYMENT_MODES: Record<DeploymentMode, {
  label: string
  description: string
  badge: string
  features: string[]
}> = {
  SAAS: {
    label: 'SaaS (Managed)',
    description: 'Fully managed by Facttic. Fastest setup, automatic updates, shared infrastructure.',
    badge: '#3b82f6',
    features: [
      'Zero infrastructure overhead',
      'Automatic governance updates',
      'SOC 2 Type II certified',
      'Multi-tenant with org isolation',
      '99.9% SLA',
    ],
  },
  VPC: {
    label: 'Private VPC',
    description: 'Deployed inside your cloud VPC. Data never leaves your network boundary.',
    badge: '#10b981',
    features: [
      'Data residency guarantee',
      'Network-level isolation',
      'HIPAA & GDPR ready',
      'Managed control plane, private data plane',
      'Custom egress rules',
    ],
  },
  SELF_HOSTED: {
    label: 'Self-Hosted',
    description: 'Full on-premise or air-gapped deployment. Your infrastructure, your control.',
    badge: '#f59e0b',
    features: [
      'Air-gapped environments supported',
      'No external network calls',
      'Full audit log ownership',
      'Custom retention policies',
      'Bring-your-own HSM for key management',
    ],
  },
}

// ── Supported regions ────────────────────────────────────────────────────────

export const REGIONS: { value: string; label: string; residency: DataResidency }[] = [
  { value: 'us-east-1',      label: 'US East (N. Virginia)',     residency: 'US' },
  { value: 'us-west-2',      label: 'US West (Oregon)',          residency: 'US' },
  { value: 'eu-west-1',      label: 'EU West (Ireland)',         residency: 'EU' },
  { value: 'eu-central-1',   label: 'EU Central (Frankfurt)',    residency: 'EU' },
  { value: 'ap-southeast-1', label: 'APAC (Singapore)',          residency: 'APAC' },
  { value: 'ap-northeast-1', label: 'APAC (Tokyo)',              residency: 'APAC' },
  { value: 'custom',         label: 'Custom / On-Premise',       residency: 'CUSTOM' },
]

// ── Compliance profile computation ───────────────────────────────────────────

export function computeComplianceProfile(
  mode: DeploymentMode,
  residency: DataResidency
): ComplianceProfile {
  const isPrivate = mode === 'VPC' || mode === 'SELF_HOSTED'
  const isEU      = residency === 'EU'
  const isUS      = residency === 'US'

  return {
    soc2:       true,                         // all modes
    gdpr:       isEU || isPrivate,            // EU residency or private deployment
    hipaa:      isPrivate,                    // VPC or Self-Hosted
    iso27001:   isPrivate,
    privateVpc: isPrivate,
    auditLogs:  true,                         // all modes
    description:
      mode === 'SAAS'
        ? 'SOC 2 Type II · Shared infrastructure · Multi-tenant isolation'
        : mode === 'VPC'
        ? 'SOC 2 · HIPAA · GDPR · Private network · Data residency enforced'
        : 'Full sovereign · Air-gap capable · HIPAA · ISO 27001 · Bring-your-own key',
  }
}

// ── Default config ────────────────────────────────────────────────────────────

export function defaultDeploymentConfig(): DeploymentConfig {
  return {
    mode: (process.env.DEPLOYMENT_MODE as DeploymentMode) ?? 'SAAS',
    region: process.env.DEPLOYMENT_REGION ?? 'us-east-1',
    data_residency: (process.env.DATA_RESIDENCY as DataResidency) ?? 'US',
  }
}
