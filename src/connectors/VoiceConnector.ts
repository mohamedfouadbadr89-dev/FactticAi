import { BaseWebhookConnector } from './BaseWebhookConnector';
import { ConnectorConfig } from './types';
import { logger } from '@/lib/logger';

export interface PipecatEvent {
  event_type: string;
  call_id: string;
  participant_id: string;
  transcript: string;
  metadata: any;
}

export class VoiceConnector extends BaseWebhookConnector {
  public name = 'VoiceConnector';
  private pipecatClient: any; // Using any for simplicity in this mock/initial version

  async initialize(config: ConnectorConfig): Promise<void> {
    await super.initialize(config);
    await this.initializePipecat(config);
  }

  async initializePipecat(config: any): Promise<void> {
    try {
      logger.info(`[${this.name}] Initializing Pipecat connector with credentials...`);
      
      // 1. Initialize a new Pipecat client instance (Mocked for now)
      this.pipecatClient = {
        apiKey: config.apiKey,
        webhookUrl: config.webhookUrl,
        on: (event: string, callback: Function) => {
          logger.debug(`[${this.name}] Subscribed to Pipecat event: ${event}`);
        }
      };

      // 2. Subscribe to the relevant Pipecat events
      this.pipecatClient.on('onTranscription', this.handleEvent.bind(this));
      this.pipecatClient.on('onTurn', this.handleEvent.bind(this));
      this.pipecatClient.on('onCallEnded', this.handleEvent.bind(this));

      logger.info(`[${this.name}] Pipecat client initialized successfully.`);
    } catch (error: any) {
      logger.error(`[${this.name}] Failed to initialize Pipecat client: ${error.message}`);
      throw error;
    }
  }

  async handleEvent(event: PipecatEvent): Promise<void> {
    logger.info(`[${this.name}] Processing event: ${event.event_type} for call ${event.call_id}`);

    // 3. Transforms the incoming event payloads into the Facttic governance schema
    const transformedData = {
      org_id: this.config?.orgId,
      session_id: event.call_id,
      user_id: event.participant_id,
      content: event.transcript,
      source: 'Pipecat',
      metadata: {
        ...event.metadata,
        event_type: event.event_type,
        channel: 'voice'
      }
    };

    // 4. Sends the transformed data to the /api/governance/evaluate endpoint
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/governance/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config?.apiKey}`
        },
        body: JSON.stringify(transformedData)
      });

      if (!response.ok) {
        throw new Error(`Governance evaluation failed: ${response.statusText}`);
      }

      logger.info(`[${this.name}] Event evaluated successfully for call ${event.call_id}`);
    } catch (error: any) {
      logger.error(`[${this.name}] Error sending data to governance evaluator: ${error.message}`);
    }
  }

  async subscribe(eventTypes: string[], webhookUrl: string): Promise<string> {
    // In a real implementation, this would call Pipecat's API to register the webhook
    return 'sub_pipecat_12345';
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    // Clean up subscription
  }
}
