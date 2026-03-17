// ── Deployment Mode Configuration ─────────────────────────────────────────────

export type DeploymentMode = 'SAAS' | 'VPC' | 'SELF_HOSTED'
export type DataResidency  = 'US' | 'EU' | 'APAC' | 'CUSTOM'

export interface ComplianceProfile {
  soc2:    boolean
  hipaa:   boolean
  gdpr:    boolean
  iso27001: boolean
}

export interface DeploymentModeConfig {
  label:       string
  description: string
  features:    string[]
}

// ── Constants ──────────────────────────────────────────────────────────────────

export const DEPLOYMENT_MODES: Record<DeploymentMode, DeploymentModeConfig> = {
  SAAS: {
    label:       'Cloud SaaS',
    description: 'Fully managed cloud deployment. Facttic handles all infrastructure, updates, and scaling.',
    features: [
      'Zero infrastructure management',
      'Automatic updates & patches',
      'Shared multi-tenant environment',
      'Pay-as-you-go pricing',
    ],
  },
  VPC: {
    label:       'VPC Isolated',
    description: 'Dedicated cloud environment within your Virtual Private Cloud. Full network isolation.',
    features: [
      'Network-level isolation',
      'Dedicated compute resources',
      'Custom VPN / PrivateLink support',
      'Enhanced compliance posture',
    ],
  },
  SELF_HOSTED: {
    label:       'Self-Hosted',
    description: 'Deploy Facttic entirely within your own infrastructure. Maximum control and data sovereignty.',
    features: [
      'Full data sovereignty',
      'On-premise or private cloud',
      'Air-gapped deployment option',
      'Custom retention & backup policies',
    ],
  },
}

export const REGIONS: Array<{ value: string; label: string; residency: DataResidency }> = [
  { value: 'us-east-1',      label: 'US East (N. Virginia)',   residency: 'US' },
  { value: 'us-west-2',      label: 'US West (Oregon)',         residency: 'US' },
  { value: 'eu-west-1',      label: 'EU West (Ireland)',        residency: 'EU' },
  { value: 'eu-central-1',   label: 'EU Central (Frankfurt)',   residency: 'EU' },
  { value: 'ap-southeast-1', label: 'APAC (Singapore)',         residency: 'APAC' },
  { value: 'ap-northeast-1', label: 'APAC (Tokyo)',             residency: 'APAC' },
  { value: 'custom',         label: 'Custom / On-Premise',      residency: 'CUSTOM' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

export function defaultDeploymentConfig(): {
  mode:           DeploymentMode
  region:         string
  data_residency: DataResidency
} {
  return {
    mode:           'SAAS',
    region:         'us-east-1',
    data_residency: 'US',
  }
}

export function computeComplianceProfile(
  mode: DeploymentMode,
  dataResidency: DataResidency
): ComplianceProfile {
  return {
    soc2:     true,
    hipaa:    mode === 'VPC' || mode === 'SELF_HOSTED',
    gdpr:     dataResidency === 'EU' || mode === 'SELF_HOSTED',
    iso27001: mode === 'VPC' || mode === 'SELF_HOSTED',
  }
}

// ── Legacy export (backwards-compat) ──────────────────────────────────────────

export const DEPLOYMENT_CONFIG = {
  mode: process.env.FACTTIC_DEPLOYMENT_MODE || 'cloud',

  get isVpcEnabled() {
    return this.mode === 'vpc'
  },

  disableExternalTelemetry() {
    if (this.isVpcEnabled) {
      console.log('VPC Isolation Active: Non-essential third-party telemetry sinks have been disabled.')
      return true
    }
    return false
  },

  blockPublicWebhooks() {
    if (this.isVpcEnabled) {
      console.log('VPC Isolation Active: Public egress webhooks bounded uniquely to VPC endpoints.')
      return true
    }
    return false
  },
}
