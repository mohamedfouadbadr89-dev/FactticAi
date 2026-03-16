# Connecting AI Systems

Connect your LLM infrastructure to Facttic AI to enable real-time governance, risk interception, and drift monitoring.

## Supported Providers

Facttic supports the following AI providers out of the box:

- **OpenAI**: Direct integration with gpt-4o, gpt-4, and gpt-3.5 models.
- **Anthropic**: Support for Claude 3.5 Sonnet, Opus, and Haiku.
- **Azure OpenAI**: Enterprise-grade Azure deployments.
- **Custom Endpoint**: Connect proprietary or self-hosted models.

## Connection Process

### 1. Select Provider
Choose your primary AI infrastructure provider from the registry.

### 2. Configure Credentials
Provide your API key and select the specific model and environment (Production, Staging, or Development).

> [!IMPORTANT]
> **Privacy First**: Facttic never stores your raw API keys. All keys are hashed using HMAC-SHA256 with an organization-specific secret before persistence.

### 3. Gateway Routing
To enable real-time protection, you must route your AI traffic through the Facttic Gateway. Update your application's base URL to the Facttic intercept endpoint:

`POST https://facttic.ai/api/gateway/intercept`

### 4. Verification
Run a test prompt through the wizard to confirm that the `GovernancePipeline` is correctly intercepting and evaluating your traffic.

## Data Isolation

All connections are bound to your `org_id`. Facttic enforces strict row-level security (RLS) to ensure that your configurations are never accessible outside your organization.
