import { ConnectorRegistry } from './ConnectorRegistry';
import { IConnector, ConnectorConfig, ConnectorHealthStatus } from './types';

// Mock Connector for testing
class MockConnector implements IConnector {
  name: string;
  config?: ConnectorConfig;

  constructor(name: string) {
    this.name = name;
  }

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config;
  }

  async authenticate(): Promise<boolean> {
    return true;
  }

  async healthcheck(): Promise<ConnectorHealthStatus> {
    return { service: this.name, status: 'healthy', lastChecked: new Date() };
  }

  async disconnect(): Promise<void> {}
}

describe('ConnectorRegistry', () => {
  let registry: ConnectorRegistry;

  beforeEach(() => {
    // Reset instance by clearing manual references (since it's singleton, we'll just clear the map)
    registry = ConnectorRegistry.getInstance();
    registry.disconnectAll();
  });

  it('should act as a singleton', () => {
    const r1 = ConnectorRegistry.getInstance();
    const r2 = ConnectorRegistry.getInstance();
    expect(r1).toBe(r2);
  });

  it('should register and retrieve a connector', () => {
    const mockAuth0 = new MockConnector('Auth0');
    registry.register(mockAuth0);
    
    const retrieved = registry.get('Auth0');
    expect(retrieved).toBeDefined();
    expect(retrieved.name).toBe('Auth0');
  });

  it('should throw an error when retrieving a non-existent connector', () => {
    expect(() => registry.get('NonExistent')).toThrow('Connector NonExistent not found in registry');
  });

  it('should get all registered connectors', () => {
    registry.register(new MockConnector('Auth0'));
    registry.register(new MockConnector('Datadog'));

    const all = registry.getAll();
    expect(all.length).toBe(2);
    expect(all.map(c => c.name)).toContain('Auth0');
    expect(all.map(c => c.name)).toContain('Datadog');
  });

  it('should perform healthchecks on all connectors', async () => {
    registry.register(new MockConnector('Auth0'));
    registry.register(new MockConnector('PagerDuty'));

    const statuses = await registry.healthcheckAll();
    expect(statuses.length).toBe(2);
    expect(statuses.every(s => s.status === 'healthy')).toBe(true);
  });
});
