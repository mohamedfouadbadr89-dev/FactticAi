import { BaseRESTConnector } from '../BaseRESTConnector';

export class ElevenLabsConnector extends BaseRESTConnector {
  public name = 'ElevenLabs';

  protected async ping(): Promise<void> {
    // ElevenLabs API health: GET /user (lightweight profile endpoint)
    await this.request('/user', { method: 'GET' });
  }
}
