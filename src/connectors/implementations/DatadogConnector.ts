import { BaseRESTConnector } from '../BaseRESTConnector';
import { ConnectorConfig } from '../types';

export class DatadogConnector extends BaseRESTConnector {
  public name = 'Datadog';

  protected getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.config?.apiKey && { 'DD-API-KEY': this.config.apiKey }),
      ...(this.config?.appKey && { 'DD-APPLICATION-KEY': this.config.appKey }),
    };
  }

  protected async ping(): Promise<void> {
    // https://docs.datadoghq.com/api/latest/authentication/#validate-api-key
    const res = await this.get<{ valid: boolean }>('/api/v1/validate');
    if (!res.valid) {
       throw new Error('Datadog API key is invalid');
    }
  }

  /**
   * Submit custom telemetry metrics to Datadog
   */
  public async submitMetric(metricName: string, value: number, tags: string[] = []): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = {
      series: [
        {
          metric: metricName,
          type: 0, // 0 = Gauge
          points: [{ timestamp, value }],
          tags
        }
      ]
    };
    
    await this.post('/api/v2/series', payload);
  }
}
