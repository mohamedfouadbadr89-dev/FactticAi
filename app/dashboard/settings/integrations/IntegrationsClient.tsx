'use client';

import React from 'react';
import { Plug, ExternalLink } from 'lucide-react';

const INTEGRATIONS = [
  { name: 'Slack', description: 'Send governance alerts to Slack channels.', href: 'https://slack.com', status: 'coming_soon' },
  { name: 'PagerDuty', description: 'Route critical incidents to on-call teams.', href: 'https://pagerduty.com', status: 'coming_soon' },
  { name: 'Datadog', description: 'Push governance metrics to your Datadog dashboard.', href: 'https://datadoghq.com', status: 'coming_soon' },
  { name: 'Webhooks', description: 'Send real-time events to any HTTP endpoint.', href: '#', status: 'coming_soon' },
];

export default function IntegrationsClient() {
  return (
    <div className="space-y-8 animate-[fadeIn_.4s_ease-in-out]">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">External Integrations</h2>
        <p className="text-sm text-[var(--text-secondary)] font-medium">
          Connect Facttic to your existing toolchain. Configuration requires admin privileges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {INTEGRATIONS.map((integration) => (
          <div key={integration.name} className="card p-6 flex items-start gap-4 opacity-60">
            <div className="p-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <Plug className="w-5 h-5 text-[var(--text-secondary)]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-tight">{integration.name}</h3>
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{integration.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-sm text-[var(--text-secondary)] flex items-center gap-3">
        <ExternalLink className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
        <span>Need a custom integration? Contact <span className="text-[var(--accent)] font-bold">support@facttic.ai</span> to request a connector.</span>
      </div>
    </div>
  );
}
