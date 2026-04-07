'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://your-domain.com';

interface Provider {
  id: string;
  name: string;
  logo: string;
  category: 'voice' | 'llm' | 'framework';
  description: string;
  webhookPath: string;
  signatureHeader: string;
  docsUrl: string;
  steps: string[];
  samplePayload?: string;
}

const PROVIDERS: Provider[] = [
  {
    id: 'vapi',
    name: 'Vapi',
    logo: '🎙',
    category: 'voice',
    description: 'Voice AI platform. Sends end-of-call transcripts via webhook.',
    webhookPath: '/api/integrations/vapi/webhook',
    signatureHeader: 'x-vapi-signature',
    docsUrl: 'https://docs.vapi.ai',
    steps: [
      'Copy the webhook URL below',
      'Go to Vapi Dashboard → Settings → Webhooks',
      'Paste the URL and save',
      'In your Vapi call config, add metadata: { "org_id": "your-org-id" }',
      'Make a test call — governance results appear in /dashboard/voice',
    ],
    samplePayload: `{ "message": { "type": "end-of-call-report", "call": { "id": "call_123", "metadata": { "org_id": "your-org-id" } }, "messages": [...] } }`,
  },
  {
    id: 'retell',
    name: 'RetellAI',
    logo: '📞',
    category: 'voice',
    description: 'Retell voice agents. Triggers on call_ended event.',
    webhookPath: '/api/integrations/retell/webhook',
    signatureHeader: 'x-retell-signature',
    docsUrl: 'https://docs.retellai.com',
    steps: [
      'Copy the webhook URL below',
      'Go to RetellAI Dashboard → Webhooks',
      'Add the URL and select "call_ended" event',
      'In your agent config, add to retell_llm_dynamic_variables: { "org_id": "your-org-id" }',
      'Make a test call to verify',
    ],
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    logo: '🔊',
    category: 'voice',
    description: 'ElevenLabs Conversational AI. Triggers on conversation.ended.',
    webhookPath: '/api/integrations/elevenlabs/webhook',
    signatureHeader: 'x-elevenlabs-signature',
    docsUrl: 'https://elevenlabs.io/docs',
    steps: [
      'Copy the webhook URL below',
      'Go to ElevenLabs → Conversational AI → Your Agent → Webhooks',
      'Add the URL for "conversation.ended" events',
      'Add to agent metadata: { "org_id": "your-org-id" }',
      'Start a conversation to test',
    ],
  },
  {
    id: 'bland',
    name: 'Bland AI',
    logo: '📱',
    category: 'voice',
    description: 'Automated voice agent infrastructure. Fires on call completion.',
    webhookPath: '/api/integrations/bland/webhook',
    signatureHeader: 'x-bland-signature',
    docsUrl: 'https://docs.bland.ai',
    steps: [
      'Copy the webhook URL below',
      'Go to Bland AI Dashboard → Webhooks',
      'Add the URL and set trigger to "call_completed"',
      'When creating a call, pass metadata: { "org_id": "your-org-id" }',
      'Make a test call to verify governance analysis appears in /dashboard/voice',
    ],
    samplePayload: `{ "call_id": "call_123", "status": "completed", "transcripts": [{ "user": "Human", "text": "Hello" }, { "user": "AI", "text": "Hi!" }], "metadata": { "org_id": "your-org-id" } }`,
  },
  {
    id: 'openai-realtime',
    name: 'OpenAI Realtime',
    logo: '⚡',
    category: 'llm',
    description: 'OpenAI Realtime API sessions. POST session data on completion.',
    webhookPath: '/api/integrations/openai-realtime/webhook',
    signatureHeader: 'openai-signature',
    docsUrl: 'https://platform.openai.com/docs',
    steps: [
      'Copy the webhook URL below',
      'When your Realtime session ends, POST the session object to this URL',
      'Include org_id in session.metadata: { "org_id": "your-org-id" }',
      'Add your API key as Bearer token in Authorization header',
    ],
    samplePayload: `{ "type": "session.ended", "session": { "id": "sess_123", "metadata": { "org_id": "your-org-id" } }, "items": [...] }`,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Agents',
    logo: '🤖',
    category: 'llm',
    description: 'Claude API / Agent SDK conversations. POST on session end.',
    webhookPath: '/api/integrations/anthropic/webhook',
    signatureHeader: 'anthropic-signature',
    docsUrl: 'https://docs.anthropic.com',
    steps: [
      'Copy the webhook URL below',
      'After each Claude conversation, POST the messages array to this URL',
      'Include org_id in metadata: { "org_id": "your-org-id" }',
    ],
    samplePayload: `{ "stop_reason": "end_turn", "org_id": "your-org-id", "messages": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }] }`,
  },
  {
    id: 'pipecat',
    name: 'Pipecat',
    logo: '🪈',
    category: 'framework',
    description: 'Open-source voice AI framework. Self-hosted — POST sessions directly.',
    webhookPath: '/api/integrations/pipecat/webhook',
    signatureHeader: '—',
    docsUrl: 'https://pipecat.ai',
    steps: [
      'Copy the webhook URL below',
      'In your Pipecat pipeline, add a post-call step that POSTs to this URL',
      'Include org_id and messages array in the body',
      'No signature required — use your Facttic API key for auth if needed',
    ],
    samplePayload: `{ "org_id": "your-org-id", "session_id": "sess_abc", "messages": [{ "role": "user", "content": "Hello" }, { "role": "assistant", "content": "Hi!" }] }`,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  voice: 'Voice Platforms',
  llm: 'LLM Providers',
  framework: 'Frameworks',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
        copied
          ? 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30'
          : 'bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
      }`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function ProviderCard({ provider }: { provider: Provider }) {
  const [expanded, setExpanded] = useState(false);
  const webhookUrl = `${BASE_URL}${provider.webhookPath}`;

  return (
    <div className="card overflow-hidden hover:border-[var(--accent)]/40 transition-colors duration-300">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl w-10 h-10 flex items-center justify-center bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
              {provider.logo}
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-[var(--text-primary)]">{provider.name}</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{provider.description}</p>
            </div>
          </div>
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors shrink-0 mt-0.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Webhook URL */}
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">Webhook URL</p>
          <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-3 py-2">
            <code className="flex-1 text-xs font-mono text-[var(--text-primary)] truncate">{webhookUrl}</code>
            <CopyButton text={webhookUrl} />
          </div>
        </div>

        {/* Signature header */}
        {provider.signatureHeader !== '—' && (
          <div className="mb-3 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
            <Zap className="w-3 h-3 text-[var(--accent)]" />
            <span>Signature header: <code className="font-mono">{provider.signatureHeader}</code></span>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide Setup' : 'Setup Guide'}
        </button>
      </div>

      {/* Expanded steps */}
      {expanded && (
        <div className="border-t border-[var(--border-primary)] p-5 space-y-4 bg-[var(--bg-secondary)]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">Steps</p>
            <ol className="space-y-2">
              {provider.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-[var(--text-primary)] font-medium">
                  <span className="w-5 h-5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {provider.samplePayload && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Sample Payload</p>
                <CopyButton text={provider.samplePayload} />
              </div>
              <pre className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all">
                {provider.samplePayload}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function IntegrationsClient() {
  const categories = ['voice', 'llm', 'framework'] as const;

  return (
    <div className="space-y-10 animate-[fadeIn_.4s_ease-in-out]">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Integrations</h2>
        <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
          Connect your voice agents and LLMs to Facttic's governance pipeline via webhooks.
        </p>
      </div>

      {/* Provider groups */}
      {categories.map(cat => {
        const group = PROVIDERS.filter(p => p.category === cat);
        return (
          <div key={cat}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-4">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {group.map(p => <ProviderCard key={p.id} provider={p} />)}
            </div>
          </div>
        );
      })}

      {/* Universal REST hint */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 space-y-2">
        <p className="text-sm font-bold text-[var(--text-primary)]">Using a different platform?</p>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          Any platform that can make HTTP requests can integrate. POST your conversation turns to:
        </p>
        <div className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2">
          <code className="flex-1 text-xs font-mono text-[var(--text-primary)] truncate">
            {BASE_URL}/api/v1/governance/evaluate
          </code>
          <CopyButton text={`${BASE_URL}/api/v1/governance/evaluate`} />
        </div>
        <p className="text-[11px] text-[var(--text-secondary)]">
          Requires <code className="font-mono">Authorization: Bearer factti_your_key</code> header.
        </p>
      </div>
    </div>
  );
}
