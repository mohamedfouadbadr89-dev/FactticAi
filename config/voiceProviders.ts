export const voiceProviders = [
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    category: 'voice',
    description: 'AI voice synthesis and streaming infrastructure.',
    models: ['multilingual-v2', 'turbo-v2.5'],
    requiredFields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'ElevenLabs API Key', type: 'password' },
      { id: 'voiceId', label: 'Voice ID', placeholder: 'e.g. 21m00Tcm4TlvDq8ikWAM', type: 'text' }
    ]
  },
  {
    id: 'vapi',
    name: 'Vapi',
    category: 'voice',
    description: 'Realtime voice agent orchestration.',
    models: ['vapi-rtc-v1'],
    requiredFields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Vapi Private Key', type: 'password' },
      { id: 'agentId', label: 'Agent ID', placeholder: 'e.g. 1234-abcd-...', type: 'text' }
    ]
  },
  {
    id: 'retell',
    name: 'Retell AI',
    category: 'voice',
    description: 'AI voice call platform.',
    models: ['retell-voice-v1'],
    requiredFields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Retell API Key', type: 'password' },
      { id: 'workspaceId', label: 'Workspace ID', placeholder: 'Retell Workspace ID', type: 'text' }
    ]
  },
  {
    id: 'bland',
    name: 'Bland AI',
    category: 'voice',
    description: 'Automated voice agent infrastructure.',
    models: ['bland-conversational'],
    requiredFields: [
      { id: 'apiKey', label: 'API Key', placeholder: 'Bland API Key', type: 'password' },
      { id: 'pathwayId', label: 'Pathway ID', placeholder: 'Pathway or Agent ID', type: 'text' }
    ]
  },
  {
    id: 'pipecat',
    name: 'Pipecat',
    category: 'voice',
    description: 'Open-source real-time voice agent framework.',
    models: ['pipecat-oss'],
    requiredFields: [
      { id: 'endpoint', label: 'Endpoint URL', placeholder: 'https://pipecat.your-infra.com', type: 'text' },
      { id: 'apiKey', label: 'API Key', placeholder: 'Infrastructure Secret', type: 'password' }
    ]
  }
];
