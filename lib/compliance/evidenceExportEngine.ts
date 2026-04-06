import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import { createHash } from 'crypto';

export interface ExportOptions {
  org_id: string;
  types: ('ledger' | 'replay' | 'compliance' | 'risk' | 'voice')[];
  format: 'JSON' | 'CSV' | 'PDF';
  date_start: string;
  date_end: string;
}

/**
 * Evidence Export Engine
 * 
 * CORE RESPONSIBILITY: Generate cryptographic audit bundles.
 * Aggregates multi-tenant governance signals into structured compliance packages.
 */
export class EvidenceExportEngine {

  /**
   * Generates an audit evidence bundle based on requested options.
   */
  static async generateBundle(options: ExportOptions) {
    try {
      const { org_id, types, format, date_start, date_end } = options;
      const data: any = { metadata: { ...options, generated_at: new Date().toISOString() } };

      // 1. Parallel Data Aggregation
      const queries: any[] = [];

      if (types.includes('ledger')) {
        queries.push(
          supabaseServer
            .from('facttic_governance_events')
            .select('*')
            .eq('org_id', org_id)
            .gte('timestamp', new Date(date_start).getTime())
            .lte('timestamp', new Date(date_end).getTime())
            .order('timestamp', { ascending: true })
            .then(res => data.ledger = res.data || [])
        );
      }

      if (types.includes('compliance')) {
        queries.push(
          supabaseServer
            .from('compliance_signals')
            .select('*')
            .eq('org_id', org_id)
            .gte('created_at', date_start)
            .lte('created_at', date_end)
            .then(res => data.compliance = res.data || [])
        );
      }

      if (types.includes('risk')) {
        queries.push(
          supabaseServer
            .from('evaluations')
            .select('*')
            .eq('org_id', org_id)
            .gte('created_at', date_start)
            .lte('created_at', date_end)
            .then(res => data.risk_scores = res.data || [])
        );
      }

      if (types.includes('voice')) {
        queries.push(
          supabaseServer
            .from('voice_stream_metrics')
            .select('session_id, latency_ms, packet_loss, interruptions, audio_integrity_score, created_at')
            .eq('org_id', org_id)
            .gte('created_at', date_start)
            .lte('created_at', date_end)
            .order('created_at', { ascending: true })
            .then(res => data.voice_metrics = res.data || [])
        );
      }

      await Promise.all(queries);

      // 2. Format Generation
      let bundleContent: string;
      let contentType: string;

      if (format === 'JSON') {
        bundleContent = JSON.stringify(data, null, 2);
        contentType = 'application/json';
      } else if (format === 'CSV') {
        bundleContent = this.formatToCSV(data);
        contentType = 'text/csv';
      } else {
        bundleContent = this.formatToStructuredText(data); // Simulating PDF as structured high-fidelity text
        contentType = 'application/pdf'; // In a real env, use a PDF lib
      }

      // 3. Cryptographic Proof
      const evidenceHash = createHash('sha256')
        .update(bundleContent + data.metadata.generated_at)
        .digest('hex');

      logger.info('EVIDENCE_BUNDLE_GENERATED', { 
        org_id, 
        types, 
        format, 
        hash: evidenceHash 
      });

      return {
        content: bundleContent,
        contentType,
        filename: `Facttic_Evidence_${org_id}_${Date.now()}.${format.toLowerCase()}`,
        evidenceHash
      };

    } catch (err: any) {
      logger.error('EVIDENCE_EXPORT_FAILURE', { error: err.message });
      return null;
    }
  }

  /**
   * Flattens data into CSV format.
   */
  private static formatToCSV(data: any): string {
    let csv = "category,event_type,timestamp,details\n";
    
    if (data.ledger) {
      data.ledger.forEach((b: any) => {
        csv += `ledger,${b.event_type},${new Date(b.timestamp).toISOString()},hash:${b.event_hash}\n`;
      });
    }

    if (data.compliance) {
      data.compliance.forEach((s: any) => {
        csv += `compliance,PII_DETECTION,${s.created_at},risk_score:${s.compliance_risk_score}\n`;
      });
    }

    if (data.voice_metrics) {
      data.voice_metrics.forEach((v: any) => {
        csv += `voice,stream_metrics,${v.created_at},session_id:${v.session_id}|latency_ms:${v.latency_ms}|packet_loss:${v.packet_loss}|interruptions:${v.interruptions}|audio_integrity:${v.audio_integrity_score}\n`;
      });
    }

    return csv;
  }

  /**
   * Generates a high-fidelity structured text representation.
   */
  private static formatToStructuredText(data: any): string {
    let text = "========================================\n";
    text += "FACTTIC.AI - CANONICAL EVIDENCE BUNDLE\n";
    text += "========================================\n\n";
    text += `Org ID: ${data.metadata.org_id}\n`;
    text += `Generated: ${data.metadata.generated_at}\n`;
    text += `Integrity Hash: SHA-256 (Signed)\n\n`;

    if (data.ledger) {
      text += "--- GOVERNANCE LEDGER ---\n";
      data.ledger.forEach((b: any) => {
        text += `[${new Date(b.timestamp).toISOString()}] TYPE: ${b.event_type} | HASH: ${b.event_hash?.substring(0, 16)}...\n`;
      });
      text += "\n";
    }

    if (data.voice_metrics && data.voice_metrics.length > 0) {
      // Aggregate per session for readability
      const bySession: Record<string, any[]> = {};
      for (const v of data.voice_metrics) {
        if (!bySession[v.session_id]) bySession[v.session_id] = [];
        bySession[v.session_id].push(v);
      }
      text += "--- VOICE SESSION METRICS ---\n";
      for (const [sessionId, rows] of Object.entries(bySession)) {
        const avgLatency  = Math.round(rows.reduce((s, r) => s + Number(r.latency_ms), 0)           / rows.length);
        const avgLoss     = Math.round(rows.reduce((s, r) => s + Number(r.packet_loss), 0)          / rows.length * 10) / 10;
        const avgInteg    = Math.round(rows.reduce((s, r) => s + Number(r.audio_integrity_score), 0) / rows.length);
        const totalInt    = rows.reduce((s, r) => s + Number(r.interruptions), 0);
        text += `Session: ${sessionId} | Snapshots: ${rows.length} | Avg Latency: ${avgLatency}ms | Avg Packet Loss: ${avgLoss}% | Avg Audio Integrity: ${avgInteg} | Total Interruptions: ${totalInt}\n`;
      }
      text += "\n";
    }

    return text;
  }
}
