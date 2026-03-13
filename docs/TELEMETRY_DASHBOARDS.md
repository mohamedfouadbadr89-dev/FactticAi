# Facttic Post-Launch Telemetry & Monitoring Profile

## 1. Prometheus Scraping Configuration (`prometheus.yml`)
Facttic exposes an internal telemetry route mapped natively to the Node.js metrics runtime gathering Active DB Connections, Memory limits, and standard API latency brackets.

```yaml
global:
  scrape_interval: 10s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: "facttic-production-api"
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: "/api/internal/metrics/prometheus"
    bearer_token: "${FACTTIC_TELEMETRY_SECRET}"

  - job_name: "facttic-database-pgbouncer"
    static_configs:
      - targets: ["db-pgbouncer:9187"]  # Supabase Native exporter
```

## 2. Grafana Thresholds & Golden Signals

### Signal 1: Latency (p95 & p99)
- **Warning**: p95 > 800ms
- **Critical (PagerDuty)**: p99 > 2000ms

### Signal 2: Traffic Headroom
- **Warning**: Nginx Ingress handling > 500 RPS sustained for 5 minutes.
- **Action**: Autoscale ECS/Kubernetes node count bounds +2.

### Signal 3: Error Rate (4xx vs 5xx)
- **4xx Normalization**: Expect bursts of 401/403s directly correlated to external webhook misconfigurations (e.g., Tenant providing a bad BYOK key). Do not escalate on 4xx.
- **5xx Critical**: Escalate any sustained 500/502 errors > 0.5% of total traffic. Indicates backend connection exhaustion or Redis rate-limit failure.

## 3. ELK Log Aggregation (Elasticsearch, Logstash, Kibana)

All JSON payload objects transmitted from `logger.ts` map natively into Elasticsearch.
- `logger.error` payloads matching `category: "SERVER_ERROR_5XX"` bypass Indexing constraints and fire SNS alerts securely delivering traces into Slack `#incidents` channels.
- RLS audit logs confirming org_id data-segregation are archived permanently into AWS Glacier after 90 days.
