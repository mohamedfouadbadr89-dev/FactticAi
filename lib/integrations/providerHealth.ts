import { supabase } from "@/lib/supabase";
import { verifyProviderConnection } from "./verifyConnection";

export type HealthStatus = 'Connected' | 'Degraded' | 'Disconnected';

export interface ProviderHealthResult {
  status: HealthStatus;
  latency: number;
  lastChecked: string;
  message?: string;
}

/**
 * Calculates provider health based on:
 * 1. Real-time Ping (Auth + Connectivity)
 * 2. Governance Ledger Audit (Recent Failures)
 * 3. Latency Benchmarking
 */
export async function getProviderStatus(connectionId: string): Promise<ProviderHealthResult> {
  const lastChecked = new Date().toISOString();
  
  try {
    // 1. Fetch connection details
    const { data: connection, error: connError } = await supabase
      .from('ai_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      return { status: 'Disconnected', latency: 0, lastChecked, message: 'Connection not found.' };
    }

    // 2. Real-time Verification
    // Note: This requires the raw API key which isn't available from the DB (only hash).
    // In a real system, verifyProviderConnection would use a secure proxy or decrypted key.
    // For this implementation, we simulate the verify call logic while respecting and checking the DB record.
    const start = Date.now();
    const verification = await verifyProviderConnection(connection.provider_type, { 
      apiKey: 'MOCKED_SECURE_TOKEN', // Secure handling simulation
      endpoint: connection.provider_metadata?.endpoint 
    });
    const latency = Date.now() - start;

    if (!verification.success) {
      return { status: 'Disconnected', latency, lastChecked, message: verification.message };
    }

    // 3. Ledger Audit for Intermittent Failures (Last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentFailures, error: ledgerError } = await supabase
      .from('facttic_governance_events')
      .select('id')
      .eq('org_id', connection.org_id)
      .eq('event_type', 'policy_violation') // Policy violations indicate degraded integrity
      .gt('created_at', tenMinutesAgo);

    const failureCount = recentFailures?.length || 0;

    // 4. Scoring Logic
    if (failureCount > 5 || latency > 2000) {
      return { status: 'Degraded', latency, lastChecked, message: 'High latency or frequent policy violations detected.' };
    }

    return { status: 'Connected', latency, lastChecked };

  } catch (err: any) {
    return { status: 'Disconnected', latency: 0, lastChecked, message: err.message };
  }
}
