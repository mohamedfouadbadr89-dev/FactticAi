# FACTTIC SECURITY THREAT MODEL_v1

## Purpose
To outline the adversarial vectors against Facttic and the formal structural mitigations ensuring continuous security, privacy, and integrity.

## Architecture Diagram Description
The security boundary encompasses the edge compute ingest tier, the central Supabase operational store, and the forensic ledger. The system operates on a segmented VPC architecture preventing cross-contamination.

## Data Flow Explanation
Data transits in an encrypted state both at rest (AES-256) and in transit (TLS 1.3). Interceptors authenticate via signed JWTs before data enters the core governance queues. Data flows unidirectionally from volatile ingestion to immutable forensic event tables.

## Security Implications
- **Spoofing**: Mitigated via strict JWT enforcement and short-lived edge session tokens.
- **Tampering**: Prevented by deterministic hashing at ingestion and write-once ledger tables enforced by PostgreSQL triggers.
- **Repudiation**: Addressed through cryptographic signatures on all forensic ledger events.

## Integration Points
- External Audit Engines (for continuous automated penetration tests).
- Role-based Access Control (RBAC) linking with enterprise IDP.

## Audit Logging Layer

`audit_logs` records:
- admin actions
- policy overrides
- security key rotations
