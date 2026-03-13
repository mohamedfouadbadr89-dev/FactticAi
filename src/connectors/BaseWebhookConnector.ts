import { IWebhookConnector, ConnectorConfig, ConnectorHealthStatus } from './types';
import { logger } from '@/lib/logger';

export abstract class BaseWebhookConnector implements IWebhookConnector {
  public abstract name: string;
  protected config?: ConnectorConfig;
  protected isInitialized = false;

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config;
    this.isInitialized = true;
    logger.info(`[${this.name}] Initialized Webhook connector`);
  }

  async authenticate(): Promise<boolean> {
    if (!this.isInitialized || !this.config) throw new Error('Connector not initialized');
    return true; 
  }

  async healthcheck(): Promise<ConnectorHealthStatus> {
    if (!this.isInitialized) {
      return { service: this.name, status: 'uninitialized', lastChecked: new Date() };
    }
    // Webhooks are push-based, health check generally validates config presence
    return { service: this.name, status: 'healthy', lastChecked: new Date() };
  }

  async disconnect(): Promise<void> {
    this.isInitialized = false;
    this.config = undefined;
    logger.info(`[${this.name}] Disconnected`);
  }

  abstract subscribe(eventTypes: string[], webhookUrl: string): Promise<string>;
  
  abstract unsubscribe(subscriptionId: string): Promise<void>;
}
