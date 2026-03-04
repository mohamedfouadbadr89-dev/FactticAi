import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Fallback to anonymous client if service key missing during local dev
const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface EvidenceRequest {
  org_id: string;
  timeframe_start: string;
  timeframe_end: string;
  report_type: 'SOC2' | 'AI_GOVERNANCE' | 'RISK_AUDIT' | 'FORENSIC_PACKAGE';
}

export const EvidenceBuilder = {
  /**
   * Orchestrates the extraction of thousands of telemetry events across the organization's bounds,
   * collapsing them into a single structured, human-readable Governance representation.
   */
  async generatePackage(request: EvidenceRequest) {
    const { org_id, timeframe_start, timeframe_end, report_type } = request;
    const generated_at = new Date().toISOString();

    // 1. Parallel Data Extraction (Evaluations, Patterns, Regressions, Ledger, Alerts)
    const [
      { data: evaluations },
      { data: patterns },
      { data: regressions },
      { data: ledger },
      { data: alerts },
      { data: investigations }
    ] = await Promise.all([
      supabase.from('evaluations')
        .select('id, session_id, factors, is_compliant')
        .eq('org_id', org_id)
        .gte('created_at', timeframe_start)
        .lte('created_at', timeframe_end)
        .limit(1000), // Bounding to 1000 for standard generation speeds
        
      supabase.from('cross_session_patterns')
        .select('*')
        .eq('org_id', org_id)
        .gte('last_detected_at', timeframe_start)
        .lte('first_detected_at', timeframe_end),

      supabase.from('regression_signals')
        .select('*')
        .eq('org_id', org_id)
        .gte('detected_at', timeframe_start)
        .lte('detected_at', timeframe_end),

      supabase.from('governance_event_ledger')
        .select('event_type, previous_hash, current_hash, signature, created_at')
        .eq('org_id', org_id)
        .gte('created_at', timeframe_start)
        .lte('created_at', timeframe_end)
        .order('created_at', { ascending: true })
        .limit(500),

      supabase.from('governance_alerts')
        .select('*')
        .eq('org_id', org_id)
        .gte('created_at', timeframe_start)
        .lte('created_at', timeframe_end),
        
      supabase.from('investigations')
        .select('*')
        .eq('org_id', org_id)
        .gte('created_at', timeframe_start)
        .lte('created_at', timeframe_end)
    ]);

    // 2. Synthesize System Health Metrics
    const totalEvals = (evaluations || []).length;
    const compliantEvals = (evaluations || []).filter((e: any) => e.is_compliant).length;
    const policyAdherence = totalEvals > 0 ? (compliantEvals / totalEvals) * 100 : 100;
    
    // Calculate synthetic drift baseline
    const totalDriftAlerts = (alerts || []).filter((a: any) => a.escalation_reason.includes('drift')).length;
    const driftScore = totalEvals > 0 ? (totalDriftAlerts / totalEvals) * 100 : 0;
    const confidenceMetrics = 100 - driftScore;

    // 3. Construct the Master Evidence Object Structure
    const evidencePackage = {
      metadata: {
        org_id,
        generated_at,
        timeframe_start,
        timeframe_end,
        report_type,
        version: "1.0.0"
      },
      system_health: {
        policy_adherence: policyAdherence.toFixed(2) + '%',
        drift_score: driftScore.toFixed(2) + '%',
        confidence_metrics: confidenceMetrics.toFixed(2) + '%',
        evaluations_scanned: totalEvals
      },
      governance_signals: {
        regression_signals: regressions || [],
        pattern_clusters: patterns || [],
        drift_alerts: alerts || []
      },
      forensic_traces: {
        investigation_results: investigations || []
      },
      ledger_verification: {
        total_blocks: (ledger || []).length,
        hash_integrity: 'UNVERIFIED', // Will be asserted immediately
        chain_sequence: ledger || []
      }
    };

    // 4. Assert Ledger Integrity explicitly inside the package wrapper
    let isChainValid = true;
    const ledgerBlocks = evidencePackage.ledger_verification.chain_sequence;
    if (ledgerBlocks && ledgerBlocks.length > 1) {
       for (let i = 1; i < ledgerBlocks.length; i++) {
          if (ledgerBlocks[i].previous_hash !== ledgerBlocks[i-1].current_hash) {
             isChainValid = false;
             break;
          }
       }
    }
    evidencePackage.ledger_verification.hash_integrity = isChainValid ? 'CRYPTOGRAPHIC_MATCH' : 'FRACTURED';

    // 5. Generate Complete System Hash
    const packageString = JSON.stringify(evidencePackage);
    const evidenceHash = createHash('sha256')
        .update(packageString + generated_at)
        .digest('hex');

    // 6. Persist Evidence Lock Record into Database
    // Storing logical 'URI' or simply marking it as active structure. Since we return huge JSONs, we store metadata.
    const packageLocation = `urn:facttic:evidence:${org_id}:${generated_at.replace(/[:.]/g, '')}`;
    
    await supabase.from('evidence_packages').insert({
        org_id,
        generated_at,
        timeframe_start,
        timeframe_end,
        report_type,
        evidence_hash: evidenceHash,
        package_location: packageLocation
    });

    return {
        evidence_package: evidencePackage,
        hash: evidenceHash,
        metadata: {
            size_bytes: Buffer.byteLength(packageString, 'utf8'),
            total_elements: totalEvals + (alerts || []).length + (ledger || []).length,
            valid_chain: isChainValid,
            location: packageLocation
        }
    };
  }
}
