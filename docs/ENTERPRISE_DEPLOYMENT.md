# Facttic Enterprise Deployment Guide
Welcome to the Facttic Enterprise self-hosting documentation. Facttic supports flexible operational topologies prioritizing Data Sovereignty and Zero-Knowledge (BYOK) cryptography architectures.

## Supported Architectures

### 1. Facttic Hybrid (Docker Compose)
Best suited for restricted on-premise deployments or rapid staging configurations.
The `deploy/docker-compose.yml` natively configures the Next.js runtime against localized PostgreSQL data layers wrapped inherently by local Supabase proxy servers. 

**Steps:**
1. Populate your `.env` following `.env.example` templates.
2. Execute `docker compose up --build -d`.
3. The platform maps directly to `localhost:3000`.

### 2. Full BYOC (Bring Your Own Cloud - Terraform)
Designed for enterprise scaling and compliance thresholds (SOC2/HIPAA) utilizing isolated AWS Virtual Private Clouds.

**Architecture Includes:**
- **ECS Fargate**: Ephemeral, zero-management compute instances hosting the Facttic governance edge logic.
- **Aurora Serverless (PostgreSQL)**: Horizontally scaling relational tiers preserving encrypted Chat and Voice payload telemetry.
- **AWS KMS**: Enforces Facttic's Bring Your Own Key protocol allowing institutional customers to revoke API evaluation access natively through their own cloud.

**Execution Outline:**
1. Configure AWS CLI mappings locally.
2. Navigate to `/deploy/terraform`.
3. `terraform init` -> `terraform plan -var="tenant_name=your_org"` -> `terraform apply`.

## Single Sign-On (SSO) Synchronization
Organizations accessing Facttic through an Enterprise License can construct rigid Authorization loops binding Facttic AI Governance Platform profiles natively to IdP providers such as Okta and Azure AD.

- Admin configurations are managed within the Facttic dashboard: `/dashboard/settings/sso`.
- Provide Facttic's ACS Assertion endpoint `https://[org].facttic.ai/api/auth/callback` to the IdP.
- Facttic intercepts incoming token groups mapping properties directly into internal database Row Level Security contexts.

For bespoke multi-tenant configurations or direct cluster monitoring, Administrators can utilize the internal Super Admin route `/admin`.
