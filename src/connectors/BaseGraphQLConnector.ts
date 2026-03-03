import { IGraphQLConnector, ConnectorConfig, ConnectorHealthStatus } from './types';
import { logger } from '@/lib/logger';

export abstract class BaseGraphQLConnector implements IGraphQLConnector {
  public abstract name: string;
  protected config?: ConnectorConfig;
  protected isInitialized = false;

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config;
    this.isInitialized = true;
    logger.info(`[${this.name}] Initialized GraphQL connector`);
  }

  async authenticate(): Promise<boolean> {
    return true; 
  }

  async healthcheck(): Promise<ConnectorHealthStatus> {
    if (!this.isInitialized) {
      return { service: this.name, status: 'uninitialized', lastChecked: new Date() };
    }
    const start = Date.now();
    try {
      await this.query('{ __typename }'); // Base introspection query
      return { service: this.name, status: 'healthy', latencyMs: Date.now() - start, lastChecked: new Date() };
    } catch (err: any) {
      return { service: this.name, status: 'down', details: err.message, lastChecked: new Date() };
    }
  }

  async disconnect(): Promise<void> {
    this.isInitialized = false;
  }

  protected getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.config?.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
    };
  }

  protected async executeGQL<T>(operation: string, variables?: Record<string, any>): Promise<T> {
    if (!this.isInitialized) throw new Error(`[${this.name}] Connector not initialized`);
    
    await this.authenticate();

    const res = await fetch(this.config?.endpoint || '', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query: operation, variables })
    });

    const data = await res.json();
    
    if (data.errors) {
       throw new Error(`[${this.name}] GraphQL Error: ${data.errors.map((e: any) => e.message).join(', ')}`);
    }

    return data.data as T;
  }

  async query<T>(queryStr: string, variables?: Record<string, any>): Promise<T> {
    return this.executeGQL<T>(queryStr, variables);
  }

  async mutate<T>(mutationStr: string, variables?: Record<string, any>): Promise<T> {
    return this.executeGQL<T>(mutationStr, variables);
  }
}
