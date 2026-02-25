import { logger } from '@/lib/logger';
import { ExecutiveComplianceSummary } from './executiveComplianceSummary';

/**
 * Institutional Pilot Activation Protocol (v6.1)
 * 
 * CORE PRINCIPLE: Controlled Exposure.
 * Manages time-bound pilot containers with strict isolation.
 */
export interface PilotContainer {
  id: string;
  orgId: string;
  expiry: string;
  status: 'ACTIVE' | 'EXPIRED';
  governanceTelemetryEnabled: boolean;
}

export class PilotActivationProtocol {
  private static pilots: PilotContainer[] = [];

  /**
   * Activates a new pilot container.
   */
  static activatePilot(orgId: string, durationDays: number = 14): PilotContainer {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + durationDays);

    const pilot: PilotContainer = {
      id: `PLT-${Math.random().toString(36).substring(7).toUpperCase()}`,
      orgId,
      expiry: expiry.toISOString(),
      status: 'ACTIVE',
      governanceTelemetryEnabled: true
    };

    this.pilots.push(pilot);
    
    logger.info('PILOT_ACTIVATED', { 
      pilotId: pilot.id, 
      orgId, 
      expiry: pilot.expiry 
    });

    return pilot;
  }

  /**
   * Generates signed telemetry export for a pilot.
   */
  static getPilotTelemetry(pilotId: string) {
    const pilot = this.pilots.find(p => p.id === pilotId);
    if (!pilot || pilot.status === 'EXPIRED') {
      throw new Error('INVALID_OR_EXPIRED_PILOT');
    }

    const summary = ExecutiveComplianceSummary.generateSummary();
    
    return {
      pilotId: pilot.id,
      orgId: pilot.orgId,
      governanceState: {
        coverage: summary.controlCoverage,
        region: summary.region,
        timestamp: summary.timestamp,
        proof: summary.signature.substring(0, 16)
      }
    };
  }
}
