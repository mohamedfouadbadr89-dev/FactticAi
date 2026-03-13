import { BaseRESTConnector } from '../BaseRESTConnector';
import { ConnectorConfig, ConnectorHealthStatus } from '../types';

export class Auth0Connector extends BaseRESTConnector {
  public name = 'Auth0';

  protected async ping(): Promise<void> {
    // Auth0 healthcheck: /api/v2/stats/active-users (requires auth)
    // For a simple ping, accessing the tenant well-known config is often lightweight
    await this.request('/.well-known/openid-configuration', { method: 'GET' });
  }

  /**
   * Fetch recent authentication and audit logs from Auth0.
   */
  public async fetchAuditLogs(limit: number = 100): Promise<any[]> {
    if (!this.isInitialized) throw new Error('Auth0Connector not initialized');
    
    // https://auth0.com/docs/api/management/v2/logs/get-logs
    const data = await this.get<any[]>('/api/v2/logs', {
       per_page: limit,
       sort: 'date:-1'
    });
    return data;
  }
}
