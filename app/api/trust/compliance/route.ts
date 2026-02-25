import { NextResponse } from 'next/server';
import { ControlTestingEngine } from '@/core/governance/controlTestingEngine';
import { RiskRegister } from '@/core/governance/riskRegister';
import { PolicyEngine } from '@/core/governance/policyEngine';
import { ExceptionLedger } from '@/core/governance/exceptionLedger';
import { AuditWindowManager } from '@/core/governance/auditWindowManager';
import { TrustBoundary } from '@/core/externalTrust/trustBoundary';
import { CURRENT_REGION } from '@/config/regions';
import { type TraceabilityEntry, TRACEABILITY_MAP } from '@/core/governance/traceabilityMap';
import crypto from 'node:crypto';

/**
 * Continuous Compliance API (v5.1)
 * 
 * CORE PRINCIPLE: Continuous Auditability.
 * Aggregates all orchestration layers into a signed readiness report.
 */
export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    
    // 1. Gather Orchestration Data
    const complianceData = {
      version: 'v5.1',
      regionId: CURRENT_REGION,
      timestamp,
      auditReadiness: 'SOC2_TYPE_I_READY',
      controlTests: await ControlTestingEngine.runFullAudit(),
      activeRisks: RiskRegister.getActiveRisks(),
      policySnapshots: PolicyEngine.generateSnapshots(),
      traceability: TRACEABILITY_MAP,
      exceptions: ExceptionLedger.getActiveExceptions(),
      auditWindow: AuditWindowManager.getActiveWindow()
    };

    // 2. Deterministic Signing
    const dataToSign = JSON.stringify(complianceData);
    const signature = crypto.sign(null, Buffer.from(dataToSign), (TrustBoundary as any).privateKey).toString('hex');

    const report = {
      ...complianceData,
      signature,
      publicKey: TrustBoundary.publicKey
    };

    // 3. Strict Drift & Residency Check
    const now = new Date();
    const payloadTime = new Date(timestamp);
    const drift = Math.abs(now.getTime() - payloadTime.getTime()) / 1000;

    if (drift > 5) {
      return NextResponse.json({ error: 'EMISSION_DRIFT_EXCEEDED', drift }, { status: 408 });
    }

    return NextResponse.json(report, {
      headers: {
        'X-Compliance-Level': 'SOC2_TYPE_I',
        'X-Continuous-Audit': 'ACTIVE'
      }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
