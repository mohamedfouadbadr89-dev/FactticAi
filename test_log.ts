import { logger } from './lib/logger';

// 1) Log sample output (Structured with 4xx/5xx tagging)
logger.error('Webhook ingestion failed', { 
  error: 'Stripe API Timeout', 
  status: 500, 
  request_id: 'req_001', 
  org_id: 'org_987',
  agent_id: 'ag_999' 
});

// 2) Alert trigger proof (Billing anomaly)
logger.warn('Billing anomaly detected: High EU spike', { 
  org_id: 'org_test_123', 
  units: 105 
});
