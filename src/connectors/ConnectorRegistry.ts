import { IConnector, ConnectorHealthStatus } from './types';
import { logger } from '@/lib/logger';

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<string, IConnector> = new Map();

  private constructor() {}

  public static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  /**
   * Register a new connector instance
   */
  public register(connector: IConnector): void {
    if (this.connectors.has(connector.name)) {
      logger.warn(`Connector ${connector.name} is already registered. Overwriting.`);
    }
    this.connectors.set(connector.name, connector);
    logger.info(`Registered connector: ${connector.name}`);
  }

  /**
   * Retrieve a specific connector by name
   */
  public get<T extends IConnector>(name: string): T {
    const connector = this.connectors.get(name);
    if (!connector) {
      throw new Error(`Connector ${name} not found in registry`);
    }
    return connector as T;
  }

  /**
   * Get all registered connectors
   */
  public getAll(): IConnector[] {
    return Array.from(this.connectors.values());
  }

  /**
   * Perform healthchecks on all registered connectors concurrently
   */
  public async healthcheckAll(): Promise<ConnectorHealthStatus[]> {
    const connectors = this.getAll();
    if (connectors.length === 0) return [];

    const checks = connectors.map(c => 
      c.healthcheck().catch(err => ({
        service: c.name,
        status: 'down' as const,
        lastChecked: new Date(),
        details: err.message
      }))
    );

    return Promise.all(checks);
  }

  /**
   * Disconnect all connectors gracefully during shutdown
   */
  public async disconnectAll(): Promise<void> {
    const disconnects = this.getAll().map(c => c.disconnect().catch(err => {
      logger.error(`Error disconnecting ${c.name}: ${err.message}`);
    }));
    await Promise.all(disconnects);
    this.connectors.clear();
  }
}
