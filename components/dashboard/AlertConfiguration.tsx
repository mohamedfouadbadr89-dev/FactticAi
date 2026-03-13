"use client";

import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, Plus, Trash2, Save, Power, Hash, TrendingUp, Activity } from 'lucide-react';
import { logger } from '@/lib/logger';

interface AlertRule {
  id?: string;
  name: string;
  metric: string;
  condition: {
    operator: string;
    threshold: number;
  };
  channels: string[];
  is_active: boolean;
}

export default function AlertConfiguration() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newRule, setNewRule] = useState<AlertRule>({
    name: 'New Alert Rule',
    metric: 'total_risk',
    condition: { operator: '>', threshold: 0.8 },
    channels: ['slack'],
    is_active: true
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/governance/alerts/config');
      const json = await res.json();
      if (json.success) setRules(json.data);
    } catch (err) {
      logger.error('FETCH_RULES_FAILED', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (rule: AlertRule) => {
    setSaving(true);
    try {
      const res = await fetch('/api/governance/alerts/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });
      if (res.ok) fetchRules();
    } catch (err) {
      logger.error('SAVE_RULE_FAILED', { error: err });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/governance/alerts/config?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchRules();
    } catch (err) {
      logger.error('DELETE_RULE_FAILED', { error: err });
    }
  };

  const toggleChannel = (rule: AlertRule, channel: string) => {
    const channels = rule.channels.includes(channel)
      ? rule.channels.filter(c => c !== channel)
      : [...rule.channels, channel];
    
    // If it's the newRule, update it directly, otherwise we'd need a more complex state
    if (rule === newRule) {
      setNewRule({ ...newRule, channels });
    } else {
      // In a real app, update the specific rule in rules array
      const updatedRules = rules.map(r => r.id === rule.id ? { ...r, channels } : r);
      setRules(updatedRules);
    }
  };

  return (
    <div className="card">
      <div className="card-header border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[var(--danger)]" />
          <h3 className="card-title text-xl">Governance Alerts</h3>
        </div>
        <p className="card-subtitle text-sm text-[var(--text-secondary)] mt-1">
          Monitor deterministic thresholds and trigger mission-critical notifications.
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Active Rules List */}
        <div className="space-y-4">
          <label className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]">Active Guardrails</label>
          <div className="space-y-3">
            {rules.length === 0 && !loading && (
              <div className="p-10 border-2 border-dashed border-[var(--border-color)] rounded-xl text-center text-[var(--text-secondary)] text-sm">
                No active alert configurations found.
              </div>
            )}
            {rules.map((rule) => (
              <div key={rule.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl flex items-center justify-between group hover:border-[var(--danger)]/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${rule.is_active ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : 'bg-gray-800 text-gray-400'}`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">{rule.name}</h4>
                    <p className="text-[11px] font-mono text-[var(--text-secondary)] uppercase">
                      IF {rule.metric} {rule.condition.operator} {rule.condition.threshold} THEN {rule.channels.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleSave({...rule, is_active: !rule.is_active})}
                    className={`p-2 rounded-lg transition-colors ${rule.is_active ? 'text-[var(--danger)] hover:bg-[var(--danger)]/10' : 'text-gray-500 hover:bg-gray-800'}`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => rule.id && handleDelete(rule.id)}
                    className="p-2 text-gray-500 hover:text-white hover:bg-red-900/40 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create New Rule Form */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="w-4 h-4 text-[var(--accent)]" />
            <h4 className="text-xs font-bold uppercase tracking-widest">New Alert Configuration</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">Rule Name</label>
              <input 
                type="text" 
                value={newRule.name} 
                onChange={e => setNewRule({...newRule, name: e.target.value})}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] p-2.5 rounded-lg text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">Target Metric</label>
              <select 
                value={newRule.metric}
                onChange={e => setNewRule({...newRule, metric: e.target.value})}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] p-2.5 rounded-lg text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="total_risk">Total Risk Score</option>
                <option value="confidence">RCA Confidence</option>
                <option value="drift_pct">Drift Magnitude</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">Threshold Condition</label>
              <div className="flex gap-2">
                <select 
                  value={newRule.condition.operator}
                  onChange={e => setNewRule({...newRule, condition: {...newRule.condition, operator: e.target.value}})}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-2.5 rounded-lg text-sm outline-none w-20"
                >
                  <option value=">">{'>'}</option>
                  <option value="<">{'<'}</option>
                  <option value="=">{'='}</option>
                </select>
                <input 
                  type="number" 
                  step="0.1"
                  value={newRule.condition.threshold}
                  onChange={e => setNewRule({...newRule, condition: {...newRule.condition, threshold: parseFloat(e.target.value)}})}
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-2.5 rounded-lg text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">Notification Channels</label>
              <div className="flex gap-2">
                {['email', 'slack', 'pagerduty'].map(c => (
                  <button
                    key={c}
                    onClick={() => toggleChannel(newRule, c)}
                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all border ${
                      newRule.channels.includes(c)
                        ? 'bg-[var(--bg-secondary)] border-[var(--accent)] text-[var(--accent)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]'
                        : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={() => handleSave(newRule)}
            disabled={saving}
            className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:translate-y-[-1px]"
          >
            {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Provision Guardrail
          </button>
        </div>
      </div>
    </div>
  );
}
