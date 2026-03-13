import { BaseRESTConnector } from '../BaseRESTConnector';
import { ConnectorConfig } from '../types';

export class PagerDutyConnector extends BaseRESTConnector {
  public name = 'PagerDuty';

  protected getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.pagerduty+json;version=2',
      ...(this.config?.apiKey && { 'Authorization': `Token token=${this.config.apiKey}` }),
      ...(this.config?.fromEmail && { 'From': this.config.fromEmail })
    };
  }

  protected async ping(): Promise<void> {
    // A lightweight endpoint to test the token
    const res = await this.get<{ abilities: string[] }>('/abilities');
    if (!res.abilities || res.abilities.length === 0) {
       throw new Error('PagerDuty API key has no abilities');
    }
  }

  /**
   * Trigger an incident via PagerDuty Events API v2
   */
  public async triggerIncident(
    routingKey: string,
    summary: string,
    source: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'error',
    customDetails: any = {}
  ): Promise<string> {
    if (!this.isInitialized) throw new Error('PagerDutyConnector not initialized');
    
    // Note: Events API v2 uses a different endpoint than standard REST API
    // https://events.pagerduty.com/v2/enqueue
    const payload = {
      routing_key: routingKey,
      event_action: 'trigger',
      payload: {
        summary,
        source,
        severity,
        custom_details: customDetails
      }
    };
    
    // We override the default request method to target the Events endpoint
    const res = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
       throw new Error(`PagerDuty Event Error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data.dedup_key;
  }
}
