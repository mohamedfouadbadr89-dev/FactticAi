# AI Provider Registry

Facttic AI maintains a modular provider registry to support diverse interaction modalities. This registry is split into domain-specific configurations to ensure clean separation of concerns and simplified maintenance.

## Registry Structure

The registry is composed of two primary configuration files:

1.  **Chat Providers**: [config/chatProviders.ts](file:///Users/macbookpro/Desktop/FactticAI/config/chatProviders.ts)
2.  **Voice Providers**: [config/voiceProviders.ts](file:///Users/macbookpro/Desktop/FactticAI/config/voiceProviders.ts)

### Common Schema

Every provider in the registry follows a standardized schema to drive the [Connection Wizard](file:///Users/macbookpro/Desktop/FactticAI/components/setup/ConnectionWizard.tsx) UI:

- `id`: Unique identifier (slug).
- `name`: Display name.
- `category`: Modality (`chat` or `voice`).
- `description`: Brief capability summary.
- `models`: Array of supported model strings or stream IDs.
- `requiredFields`: Metadata for secure BYOK input fields.

## Adding a New Provider

To add a new infrastructure provider:

1.  Identify the modality (**Chat** or **Voice**).
2.  Update the corresponding configuration file.
3.  Define the `requiredFields` based on the provider's API requirements.
4.  Ensure the [Provider Verification System](file:///Users/macbookpro/Desktop/FactticAI/docs/integrations/verification.md) is updated to support the new provider's health check.

## Usage in UI

The `ConnectionWizard` dynamically renders provider cards and configuration fields by combining these registries:

```typescript
import { chatProviders } from '@/config/chatProviders';
import { voiceProviders } from '@/config/voiceProviders';

const ALL_PROVIDERS = [...chatProviders, ...voiceProviders];
```
