import { BaseRESTConnector } from '../BaseRESTConnector';

export class VapiConnector extends BaseRESTConnector {
  public name = 'Vapi';

  protected async ping(): Promise<void> {
    // Vapi API health: GET /calls with limit=1 is a lightweight probe
    await this.request('/call?limit=1', { method: 'GET' });
  }
}
