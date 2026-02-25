import { NextResponse } from 'next/server';
import { EvidenceScheduler } from '@/core/governance/evidenceScheduler';
import { AuditorScopeManager } from '@/core/governance/auditorScopeManager';
import { EvidenceRedactionLayer } from '@/core/governance/evidenceRedactionLayer';
import { AuditorQueryLog } from '@/core/governance/auditorQueryLog';
import { AuditWindowManager } from '@/core/governance/auditWindowManager';
import { CURRENT_REGION } from '@/config/regions';

/**
 * Auditor Evidence Portal API (v5.3)
 * 
 * CORE PRINCIPLE: Governed Delivery.
 * Delivers signed, redacted evidence bundles to authorized auditors.
 */
export async function POST(req: Request) {
  try {
    const { token, action } = await req.json();

    // 1. Enforce Scope Boundary
    const { scopeId, valid } = AuditorScopeManager.validateScope(token, CURRENT_REGION);
    if (!valid) {
      return NextResponse.json({ error: 'INVALID_SCOPE' }, { status: 403 });
    }

    // 2. Enforce Audit Window Lock Requirement
    const activeWindow = AuditWindowManager.getActiveWindow();
    if (activeWindow && activeWindow.status !== 'LOCKED') {
      return NextResponse.json({ error: 'AUDIT_WINDOW_NOT_LOCKED' }, { status: 423 });
    }

    // 3. Log Request
    AuditorQueryLog.logQuery(scopeId, action);

    // 4. Generate & Redact Evidence
    // For v5.3, we trigger a daily cycle simulation for the auditor
    const snapshot = await EvidenceScheduler.triggerCycle('DAILY');
    const redactedResults = EvidenceRedactionLayer.redactResults(snapshot.results);

    const secureSnapshot = {
      ...snapshot,
      results: redactedResults,
      redacted: true,
      auditorScope: scopeId
    };

    return NextResponse.json(secureSnapshot, {
      headers: {
        'X-Auditor-Scope': scopeId,
        'X-Redaction-Status': 'ENFORCED'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
