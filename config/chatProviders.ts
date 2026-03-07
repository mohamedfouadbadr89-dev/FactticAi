import { Shield, Bot, Server, Activity } from "lucide-react";

export const chatProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: 'openai',
    description: 'Universal Chat and Reasoning models.',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    category: 'chat',
    requiredFields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'sk-...', type: 'password' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: 'anthropic',
    description: 'Deterministic and safe text generation.',
    models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-haiku'],
    category: 'chat',
    requiredFields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'xpk-...', type: 'password' }
    ]
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    icon: 'azure',
    description: 'Enterprise-grade Chat infrastructure.',
    models: ['gpt-4', 'gpt-35-turbo'],
    category: 'chat',
    requiredFields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Azure Secret Key', type: 'password' },
      { id: 'endpoint', label: 'Endpoint URL', placeholder: 'https://resource.openai.azure.com/', type: 'text' }
    ]
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    icon: 'custom',
    description: 'On-premise or private Chat models.',
    models: ['custom-model-v1'],
    category: 'chat',
    requiredFields: [
      { id: 'endpoint', label: 'Endpoint URL', placeholder: 'https://api.yourdomain.com/v1', type: 'text' },
      { id: 'apiKey', label: 'API Key', placeholder: 'Custom Token', type: 'password' }
    ]
  }
];
