import { IRESTConnector, ConnectorConfig, ConnectorHealthStatus } from './types';
import { logger } from '@/lib/logger';

export abstract class BaseRESTConnector implements IRESTConnector {
  public abstract name: string;
  protected config: ConnectorConfig | undefined;
  protected isInitialized = false;

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config;
    this.isInitialized = true;
    logger.info(`[${this.name}] Initialized REST connector`);
  }

  async authenticate(): Promise<boolean> {
    if (!this.isInitialized || !this.config) throw new Error('Connector not initialized');
    // Base implementation assume API key auth handling directly in fetches
    // Can be overridden for OAuth-based connectors
    return true; 
  }

  async healthcheck(): Promise<ConnectorHealthStatus> {
    if (!this.isInitialized) {
      return { service: this.name, status: 'uninitialized', lastChecked: new Date() };
    }
    const start = Date.now();
    try {
      // Abstract method or ping endpoint implemented by subclasses
      await this.ping();
      const latencyMs = Date.now() - start;
      return { service: this.name, status: 'healthy', latencyMs, lastChecked: new Date() };
    } catch (err: any) {
       return { 
         service: this.name, 
         status: 'down', 
         lastChecked: new Date(),
         details: err.message
       };
    }
  }

  async disconnect(): Promise<void> {
    this.isInitialized = false;
    this.config = undefined;
    logger.info(`[${this.name}] Disconnected`);
  }

  // To be implemented by concrete classes
  protected abstract ping(): Promise<void>;
  
  protected getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.config?.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
    };
  }

  protected async request<T>(path: string, options: RequestInit): Promise<T> {
    if (!this.isInitialized) throw new Error(`[${this.name}] Connector not initialized`);
    
    // Auto-authenticate if needed
    await this.authenticate();

    const url = `${this.config?.endpoint || ''}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      }
    });

    if (!res.ok) {
      throw new Error(`[${this.name}] HTTP Error ${res.status}: ${res.statusText}`);
    }

    // Some APIs might not return JSON on DELETE
    if (res.status === 204) return {} as T;
    
    return await res.json() as T;
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const queryStr = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>(path + queryStr, { method: 'GET' });
  }

  async post<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  async put<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}
