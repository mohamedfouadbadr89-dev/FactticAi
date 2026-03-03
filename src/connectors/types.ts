export interface ConnectorConfig {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  [key: string]: any;
}

export interface ConnectorHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'uninitialized';
  latencyMs?: number;
  lastChecked: Date;
  details?: string;
}

export interface IConnector {
  name: string;
  
  /**
   * Set up the connector instance with config/credentials
   */
  initialize(config: ConnectorConfig): Promise<void>;
  
  /**
   * Perform any necessary authentication steps (e.g. fetching OAuth tokens)
   */
  authenticate(): Promise<boolean>;
  
  /**
   * Check the status and availability of the external service
   */
  healthcheck(): Promise<ConnectorHealthStatus>;
  
  /**
   * Gracefully shut down and clean up the connection
   */
  disconnect(): Promise<void>;
}

export interface IRESTConnector extends IConnector {
  get<T>(path: string, params?: Record<string, any>): Promise<T>;
  post<T>(path: string, body: any): Promise<T>;
  put<T>(path: string, body: any): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

export interface IGraphQLConnector extends IConnector {
  query<T>(queryStr: string, variables?: Record<string, any>): Promise<T>;
  mutate<T>(mutationStr: string, variables?: Record<string, any>): Promise<T>;
}

export interface IWebhookConnector extends IConnector {
  subscribe(eventTypes: string[], webhookUrl: string): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<void>;
}
