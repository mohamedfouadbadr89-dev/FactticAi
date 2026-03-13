import { BaseRESTConnector } from '../BaseRESTConnector';

export class RetellConnector extends BaseRESTConnector {
  public name = 'Retell AI';

  protected async ping(): Promise<void> {
    // Retell API health: list agents endpoint
    await this.request('/list-agents', { method: 'GET' });
  }
}
