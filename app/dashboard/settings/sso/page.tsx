'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SSOSettingsPage() {
  const [providerType, setProviderType] = useState<'saml' | 'oidc'>('saml');
  const [metadataUrl, setMetadataUrl] = useState('');
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Submit SAML/OIDC metadata bindings to the API bridging `sso_configs`
    setTimeout(() => {
      setIsLoading(false);
      router.refresh();
    }, 1200);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      <div className="pb-6 border-b border-[var(--border-primary)]">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)]">Enterprise SSO Configuration</h1>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Map external Identity Providers (Okta, Azure AD) for authorized tenant access.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="section-card p-8 transition-colors duration-300">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6 border-l-2 border-[var(--accent)] px-3">Identity Provider Details</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-[var(--text-secondary)]">Provider Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-sm text-[var(--text-primary)]">
                    <input type="radio" value="saml" checked={providerType === 'saml'} onChange={() => setProviderType('saml')} className="accent-[var(--accent)]" />
                    <span>SAML 2.0</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-[var(--text-primary)]">
                    <input type="radio" value="oidc" checked={providerType === 'oidc'} onChange={() => setProviderType('oidc')} className="accent-[var(--accent)]" />
                    <span>OIDC</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="domain" className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-[var(--text-secondary)]">Associated Domain</label>
                <input id="domain" type="text" value={domain} onChange={(e) => setDomain(e.target.value)} required placeholder="acme.com"
                  className="w-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-3 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
                <p className="mt-2 text-xs text-[var(--text-secondary)]">Users signing in with this email domain will be redirected to your IdP.</p>
              </div>

              <div>
                <label htmlFor="metadata" className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-[var(--text-secondary)]">Metadata XML URL or Discovery Endpoint</label>
                <input id="metadata" type="url" value={metadataUrl} onChange={(e) => setMetadataUrl(e.target.value)} required placeholder="https://dev-xxxx.okta.com/app/exk.../sso/saml/metadata"
                  className="w-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-3 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div className="pt-4 border-t border-[var(--border-primary)] flex justify-end">
                <button type="submit" disabled={isLoading}
                  className="bg-[var(--accent)] text-[var(--bg-primary)] font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-lg hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50">
                  {isLoading ? 'Saving...' : 'Establish Trust'}
                </button>
              </div>
            </div>
          </form>

          <div className="section-card p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6 border-l-2 border-[var(--accent)] px-3">Role Synchronization Properties</h3>
            <p className="text-sm mb-4 text-[var(--text-secondary)]">Facttic natively syncs IdP `groups` arrays to internal RBAC `profiles` configurations upon successful token resolution.</p>
            
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 font-mono text-xs overflow-x-auto text-[var(--text-primary)]">
              {`{
  "saml_attribute_mapping": {
    "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "groups": "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
  }
}`}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="section-card p-6 bg-green-500/5 border border-green-500/20">
            <h4 className="text-xs font-bold uppercase tracking-widest text-green-500 mb-2">Supabase Assertion URLs</h4>
            <p className="text-xs text-[var(--text-secondary)] mb-3">Include this Assertion Consumer Service (ACS) URL in your Identity Provider app configuration:</p>
            <code className="block p-2 bg-[var(--bg-secondary)] rounded border border-[var(--border-primary)] text-[10px] break-all text-[var(--text-primary)]">
              https://facttic.supabase.co/auth/v1/sso/saml/acs
            </code>
          </div>
          
          <div className="border border-dashed border-[var(--border-primary)] rounded-[12px] p-8 text-center section-card shadow-none">
             <div className="text-xs font-bold uppercase tracking-[0.3em] mb-2 text-[var(--text-primary)]">Strict Enforcement</div>
             <p className="text-xs font-medium text-[var(--text-secondary)] mb-4">When SSO is strictly enforced, regular email/password logins for this domain are automatically blocked.</p>
             <button className="w-full border border-red-500/30 text-red-500 font-black uppercase tracking-widest text-[10px] px-4 py-3 rounded-lg hover:bg-red-500/10 transition-colors">
               Enforce SSO Only
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
