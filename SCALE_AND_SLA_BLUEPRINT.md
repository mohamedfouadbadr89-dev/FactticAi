# Scale & SLA Blueprint: Facttic v3.7

## 1. 10x Capacity Targets
Facttic is designed to scale from 1,000 to 10,000 active organizations through:
- **Vertical DB Scaling**: Transitioning to large dedicated Supabase instances with pgvector optimizations.
- **Horizonal API Scaling**: Multi-cluster Vercel/Next.js deployment.
- **Global Cache**: Multi-region Redis for global rate-limiting sync.

## 2. Multi-Region Roadmap
- **Phase 1 (Q2 2026)**: US-East + EU-West (Sovereignty parity).
- **Phase 2 (Q4 2026)**: APAC (Singapore/Tokyo).
- **Isolation**: Each region maintains isolated VPC clusters for zero-latency identity resolution.

## 3. Enterprise SLA
Facttic guarantees the following service levels for Institutional Partners:

| Service | SLA | Penalty (Credit) |
| :--- | :--- | :--- |
| **Availability** | 99.95% | 10% Service Credit |
| **P95 Latency** | < 250ms | 5% Service Credit |
| **Security Response** | < 2 Hours | 20% Service Credit |
| **Drift Escalation** | < 5 Minutes | 10% Service Credit |

## 4. Support Tiers
- **Silver**: E-mail (24h).
- **Gold**: Chat (4h).
- **Institutional Platinum**: Slack/PagerDuty Sync (< 15 min Critical).
