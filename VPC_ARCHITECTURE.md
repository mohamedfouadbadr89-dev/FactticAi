# Institutional VPC Deployment Blueprint (v3.1)

## Architecture Overview
This blueprint defines the Facttic single-tenant VPC model, providing extreme isolation for institutional clients requiring dedicated infrastructure.

## 1. Component Isolation

### Database (PostgreSQL)
- **Deployment**: Dedicated Amazon RDS or Google Cloud SQL instance.
- **Access**: Restricted to VPC-only peering. No public internet access.
- **Hardening**: Mandatory TLS 1.3, RLS active, and point-in-time recovery (PITR) enabled.

### Cache (Redis)
- **Deployment**: Isolated ElastiCache or Memorystore cluster.
- **Encryption**: AES-256 for data at rest and in transit.
- **Scaling**: Dedicated instance prevents "noisy neighbor" interference.

### Object Storage
- **Deployment**: Dedicated S3 bucket or GCS bucket with VPC endpoints.
- **Isolation**: Bucket-level policies restricted to the specific VPC identity.

## 2. Encryption & Key Management (BYOK)
The "Bring Your Own Key" architecture ensures that the client retains control over their data's physical encryption.

- **Mechanism**: Integration with AWS KMS or Google Cloud KMS.
- **Isolation**: Each tenant uses a unique Customer Managed Key (CMK) for:
  - Database disk encryption.
  - S3 object encryption.
  - Snapshot backups.

## 3. Deployment Topology
- **Multi-AZ**: High availability across multiple Availability Zones.
- **Ingress**: WAF-protected endpoints with IP allowlisting.
- **Egress**: Restricted via NAT Gateways with explicit egress rules.

## 4. Compliance & Observability
- **Audit Logs**: Streamed directly to the client's SIEM (e.g., Splunk, Datadog).
- **VPC Flow Logs**: Enabled for comprehensive network auditability.
- **Compliance**: Ready for SOC2 Type II and HIPAA environments.
