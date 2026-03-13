# API Integration Framework & Connectors Library

This directory contains the foundational architecture for integrating FactticAI with external institutional systems (e.g., Auth0, Datadog, PagerDuty).

## Architecture

The framework relies on a generic `IConnector` interface and strict TypeScript typings to ensure uniform lifecycle management across diverse data sources.

### Core Interface (`IConnector`)
Every connector must implement:
- `initialize(config)`: Hydrate the connector with target endpoint arrays and cryptographic keys.
- `authenticate()`: Exchange credentials or assert header validity.
- `healthcheck()`: Measure sub-second connection latency and service availability.
- `disconnect()`: Terminate active polling or socket threads gracefully.

### Base Classes
To reduce boilerplate, we provide HTTP-specific abstract base classes:
- **`BaseRESTConnector`**: Wraps the standard `fetch` API for RESTful interfaces, exposing typed `get`, `post`, `put`, and `delete` methods.
- **`BaseGraphQLConnector`**: Exposes typed `query` and `mutate` methods to easily compose GQL JSON payloads.
- **`BaseWebhookConnector`**: Outlines `subscribe` and `unsubscribe` patterns for push-based systems.

## Component: `ConnectorRegistry`

The `ConnectorRegistry` is an application-wide Singleton engineered to marshal and inject active connectors.

```typescript
import { ConnectorRegistry } from '@/src/connectors/ConnectorRegistry';

const registry = ConnectorRegistry.getInstance();
const auth0 = registry.get<Auth0Connector>('Auth0');
await auth0.fetchLatestTelemetry();
```

## Adding a New Connector

1. Create a new file in `src/connectors/implementations/` (e.g., `SalesforceConnector.ts`).
2. Extend the appropriate Base class (e.g., `export class SalesforceConnector extends BaseRESTConnector`).
3. Define the abstract properties (`name`) and functions (`ping()`).
4. Import and bind the instance within the `startupChecks.ts` or respective initialization sequence, calling `registry.register(new SalesforceConnector())`.
