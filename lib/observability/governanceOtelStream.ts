import { logger } from '../logger';

export interface GovernanceOtelEvent {
  event_type: string;
  timestamp: string;
  org_id: string;
  risk_score: number;
  metadata: Record<string, any>;
}

/**
 * OpenTelemetry Governance Stream Engine
 * 
 * CORE PRINCIPLE: Transform internal governance signals into OTel-compatible observability events.
 */
export class GovernanceOtelStream {
  /**
   * Formats a raw governance event into an OTel-compatible JSON structure.
   * Follows OTel semantic conventions where applicable.
   */
  static formatAsOtel(event: GovernanceOtelEvent): any {
    return {
      resource: {
        attributes: {
          'service.name': 'facttic-governance-engine',
          'facttic.org_id': event.org_id,
          'facttic.environment': process.env.NODE_ENV || 'development'
        }
      },
      scopeLogs: [
        {
          scope: { name: 'governance.stream' },
          logRecords: [
            {
              timeUnixNano: new Date(event.timestamp).getTime() * 1000000,
              severityText: event.risk_score > 70 ? 'ERROR' : event.risk_score > 40 ? 'WARN' : 'INFO',
              body: { stringValue: `Governance Event: ${event.event_type}` },
              attributes: [
                { key: 'event.type', value: { stringValue: event.event_type } },
                { key: 'governance.risk_score', value: { doubleValue: event.risk_score } },
                ...Object.entries(event.metadata).map(([key, value]) => ({
                  key: `governance.metadata.${key}`,
                  value: this.wrapValue(value)
                }))
              ]
            }
          ]
        }
      ]
    };
  }

  /**
   * Helper to wrap values for OTel JSON format.
   */
  private static wrapValue(value: any): any {
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'number') return { doubleValue: value };
    if (typeof value === 'boolean') return { boolValue: value };
    return { stringValue: JSON.stringify(value) };
  }

  /**
   * Internal emitter (can be extended for direct OTLP export).
   */
  static emit(event: GovernanceOtelEvent) {
    const otelPayload = this.formatAsOtel(event);
    logger.debug('OTEL_EVENT_EMITTED', { eventType: event.event_type, orgId: event.org_id });
    // In a production env, this might push to a queue or OTLP collector endpoint.
    return otelPayload;
  }
}
