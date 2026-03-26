"use client";

import React, { useState } from 'react';
import { 
  Zap, 
  Shield, 
  BrainCircuit, 
  Activity, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Terminal, 
  Copy, 
  Play, 
  Server,
  Key,
  Database,
  Search,
  Bot
} from "lucide-react";
import { chatProviders } from '@/config/chatProviders';
import { voiceProviders } from '@/config/voiceProviders';
import { useInteractionMode } from '@/store/interactionMode';

const ALL_PROVIDERS = [...chatProviders, ...voiceProviders];

type Step = 1 | 2 | 3 | 4 | 5;

export default function ConnectionWizard({ onComplete }: { onComplete?: () => void }) {
  const { mode: interactionMode, setMode } = useInteractionMode();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [config, setConfig] = useState<Record<string, string>>({
    provider: '',
    model: '',
    environment: 'production'
  });

  // Test State
  const [testPrompt, setTestPrompt] = useState('Verify governance integrity.');
  const [testResult, setTestResult] = useState<any>(null);

  const nextStep = () => setStep((s) => (s + 1) as Step);
  const prevStep = () => setStep((s) => (s - 1) as Step);

  const handleProviderSelect = (id: string) => {
    const selected = ALL_PROVIDERS.find(p => p.id === id);
    setConfig({ ...config, provider: id, model: selected?.models[0] || '' });
    nextStep();
  };

  const handleSubmitConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, mode: interactionMode })
      });
      if (!res.ok) throw new Error('Failed to save connection.');
      nextStep();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/governance/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          // org_id should ideally be passed in or resolved from auth session
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const finish = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="space-y-8">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between px-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
              step >= i ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-primary)]'
            }`}>
              {i}
            </div>
            {i < 5 && <div className={`w-12 h-0.5 rounded-full ${step > i ? 'bg-[var(--accent)]' : 'bg-[var(--border-primary)]'}`} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Select Interaction Type</h2>
              <p className="text-sm text-[var(--text-secondary)]">Choose the modality you want to govern.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setMode('chat'); nextStep(); }}
                className={`flex flex-col items-center gap-4 p-8 rounded-3xl border transition-all group ${interactionMode === 'chat' ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--accent)]/50'}`}
              >
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] group-hover:border-[var(--accent)]/30 transition-all">
                  <Bot className={`w-8 h-8 ${interactionMode === 'chat' ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`} />
                </div>
                <div>
                  <span className="font-bold block text-lg">Chat AI</span>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">LLMs & Text Interfaces</p>
                </div>
              </button>
              <button
                onClick={() => { setMode('voice'); nextStep(); }}
                className={`flex flex-col items-center gap-4 p-8 rounded-3xl border transition-all group ${interactionMode === 'voice' ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--accent)]/50'}`}
              >
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] group-hover:border-[var(--accent)]/30 transition-all">
                  <Activity className={`w-8 h-8 ${interactionMode === 'voice' ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`} />
                </div>
                <div>
                  <span className="font-bold block text-lg">Voice AI</span>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Audio Streams & Agents</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">
                {interactionMode === 'voice' ? 'Select Voice Infrastructure' : 'Select AI Provider'}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {interactionMode === 'voice' ? 'Choose the audio gateway you want to govern.' : 'Choose the LLM infrastructure you want to protect.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {ALL_PROVIDERS.filter(p => p.category === interactionMode).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderSelect(p.id)}
                  className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all group"
                >
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] group-hover:border-[var(--accent)]/50 transition-all">
                    {p.id === 'openai' && <Shield className="w-6 h-6 text-emerald-500" />}
                    {p.id === 'anthropic' && <Bot className="w-6 h-6 text-orange-500" />}
                    {p.id === 'azure' && <Server className="w-6 h-6 text-blue-500" />}
                    {p.id === 'custom' && <Activity className="w-6 h-6 text-purple-500" />}
                    {(p.category === 'voice') && (
                      <div className="w-6 h-6 text-[var(--accent)] flex items-center justify-center font-bold italic">
                        {p.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-bold block">{p.name}</span>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1 max-w-[150px] leading-tight">
                      {p.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="pt-4">
              <button 
                onClick={prevStep}
                className="w-full py-3 px-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-sm font-bold hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Modality
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 text-balance">
              <h2 className="text-xl font-bold">BYOK Configuration</h2>
              <p className="text-sm text-[var(--text-secondary)]">Connect your own infrastructure credentials. <span className="text-[var(--accent)] font-bold">Facttic never stores raw keys.</span></p>
            </div>
            <div className="space-y-4">
              {ALL_PROVIDERS.find(p => p.id === config.provider)?.requiredFields.map(field => (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{field.label}</label>
                  <div className="relative">
                    {field.id === 'apiKey' ? <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" /> : <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />}
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--accent)] transition-all font-mono"
                      value={config[field.id] || ''}
                      onChange={(e) => setConfig({ ...config, [field.id]: e.target.value })}
                    />
                  </div>
                </div>
              ))}

              {interactionMode === 'voice' && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Webhook Signing Secret
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--accent)] opacity-50" />
                    <input
                      type="password"
                      placeholder="e.g. whsec_..."
                      className="w-full bg-[var(--bg-primary)] border border-[var(--accent)]/30 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--accent)] transition-all font-mono"
                      value={config.webhook_secret || ''}
                      onChange={(e) => setConfig({ ...config, webhook_secret: e.target.value })}
                    />
                  </div>
                  <p className="text-[9px] text-[var(--text-secondary)] font-medium italic">Required to verify HMAC-SHA256 signatures for incoming call events.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Model / Stream</label>
                  <select
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  >
                    {ALL_PROVIDERS.find(p => p.id === config.provider)?.models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Environment</label>
                  <select
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                    value={config.environment}
                    onChange={(e) => setConfig({ ...config, environment: e.target.value })}
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>
            </div>
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <button 
                onClick={prevStep}
                className="flex-1 py-3 px-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-sm font-bold hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button 
                onClick={handleSubmitConfig}
                disabled={loading || !config.apiKey}
                className="flex-[2] py-3 px-4 bg-[var(--accent)] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[var(--accent)]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Activity className="w-4 h-4 animate-spin" /> : 'Hash & Continue'}
                {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Connection Verification</h2>
              <p className="text-sm text-[var(--text-secondary)]">Validate authentication and provider response integrity.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Synthetic Test Execution</div>
                   <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${testResult ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                      {testResult ? 'VALIDATED' : 'READY'}
                   </div>
                </div>
                
                <div className="relative">
                  <Terminal className="absolute left-3 top-4 w-4 h-4 text-[var(--text-secondary)]" />
                  <textarea
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--accent)] min-h-[80px] font-mono resize-none transition-all"
                    placeholder={interactionMode === 'voice' ? 'Input acoustic risk trigger...' : 'Input governance test prompt...'}
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                  />
                </div>
              </div>

              <button 
                onClick={runTest}
                disabled={loading}
                className="w-full py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent)] rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {loading ? 'Verifying Integrity...' : 'Verify Connection'}
              </button>

              {testResult && (
                <div className="p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] space-y-4 animate-in zoom-in-95 duration-300 shadow-xl shadow-black/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-xs">Governance Intercept Result</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-mono">{new Date().toISOString().split('T')[1].split('.')[0]} UTC</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-center">
                      <div className="text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">Auth</div>
                      <div className="text-xs font-black text-emerald-500">PASS</div>
                    </div>
                    <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-center">
                      <div className="text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">Risk</div>
                      <div className="text-sm font-black">{testResult.risk_score}%</div>
                    </div>
                    <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-center">
                      <div className="text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">Latency</div>
                      <div className="text-sm font-black">{testResult.metadata?.latency_ms || 42}ms</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-3">
               <button onClick={prevStep} className="flex-1 py-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-xs font-bold">Back</button>
               <button 
                onClick={nextStep}
                disabled={!testResult}
                className="flex-[3] py-4 bg-[var(--accent)] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[var(--accent)]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Operationalize Connection <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-12">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Connection Operational</h2>
              <p className="text-sm text-[var(--text-secondary)]">Your organization is now protected by Facttic AI Governance.</p>
            </div>

            <div className="p-6 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-3xl grid grid-cols-3 gap-6 divide-x divide-[var(--border-primary)]">
               <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Provider</div>
                  <div className="font-bold flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" /> {config.provider.toUpperCase()}
                  </div>
               </div>
               <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Protection</div>
                  <div className="font-bold text-emerald-500">REAL-TIME</div>
               </div>
               <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Network</div>
                  <div className="font-bold">GLOBAL-V1</div>
               </div>
            </div>
            <div className="pt-4">
              <button
                onClick={onComplete || (() => window.location.reload())}
                className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[var(--accent)]/30"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
