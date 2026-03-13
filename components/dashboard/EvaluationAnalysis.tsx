"use client";

import React, { useState, useEffect } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from "recharts";
import { logger } from "@/lib/logger";

import { TurnRiskScore } from "@/lib/riskTypes";

export interface EvaluationData extends TurnRiskScore {
  id: string;
  interaction_id: string;
  severity_level: string;
  // creation_date and model_id are now in TurnRiskScore
}

interface Props {
  filters?: {
    startDate: string;
    endDate: string;
    modelVersion: string;
    channels: string[];
  };
}

export default function EvaluationAnalysis({ filters }: Props) {
  const [data, setData] = useState<EvaluationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof EvaluationData, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    async function fetchEvaluations() {
      try {
        const res = await fetch('/api/governance/investigations'); 
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        
        if (!result.data || result.data.length === 0) {
          setData([
            { id: "1", interaction_id: "int_001", total_risk: 0.25, severity_level: "low", confidence: 0.98, creation_date: new Date(Date.now() - 86400000).toISOString(), model_id: "baseline-v1", factors: {}, timestamp: new Date(Date.now() - 86400000).toISOString() },
            { id: "2", interaction_id: "int_002", total_risk: 0.65, severity_level: "high", confidence: 0.92, creation_date: new Date(Date.now() - 172800000).toISOString(), model_id: "baseline-v1", factors: {}, timestamp: new Date(Date.now() - 172800000).toISOString() },
            { id: "3", interaction_id: "int_003", total_risk: 0.45, severity_level: "medium", confidence: 0.95, creation_date: new Date(Date.now() - 259200000).toISOString(), model_id: "baseline-v1", factors: {}, timestamp: new Date(Date.now() - 259200000).toISOString() },
            { id: "4", interaction_id: "int_004", total_risk: 0.85, severity_level: "critical", confidence: 0.88, creation_date: new Date(Date.now() - 345600000).toISOString(), model_id: "baseline-v1", factors: {}, timestamp: new Date(Date.now() - 345600000).toISOString() },
            { id: "5", interaction_id: "int_005", total_risk: 0.15, severity_level: "minimal", confidence: 0.99, creation_date: new Date(Date.now() - 432000000).toISOString(), model_id: "baseline-v1", factors: {}, timestamp: new Date(Date.now() - 432000000).toISOString() },
          ]);
        } else {
          setData(result.data.map((d: any) => ({
            id: d.id,
            interaction_id: d.interaction_id || d.id,
            total_risk: d.total_risk || (d.severity === 'High' ? 0.8 : 0.3),
            severity_level: d.severity?.toLowerCase() || 'medium',
            confidence: d.rca_confidence || 0.9,
            creation_date: d.created_at || new Date().toISOString(),
            model_id: d.model_id || "gen-v1",
            factors: d.factors || {},
            timestamp: d.created_at || new Date().toISOString()
          })));
        }
      } catch (err) {
        logger.error('EVALUATION_ANALYSIS_FETCH_FAILED', { error: err });
      } finally {
        setLoading(false);
      }
    }

    fetchEvaluations();
  }, []);

  const sortedData = React.useMemo(() => {
    let items = [...data];
    
    // Global filter: Date Range
    if (filters?.startDate) {
      const start = new Date(filters.startDate).getTime();
      items = items.filter(i => new Date(i.creation_date || i.timestamp || "").getTime() >= start);
    }
    if (filters?.endDate) {
      const end = new Date(filters.endDate).getTime();
      items = items.filter(i => new Date(i.creation_date || i.timestamp || "").getTime() <= end);
    }

    // Global filter: Model Version
    if (filters?.modelVersion && filters.modelVersion !== 'all') {
      items = items.filter(i => i.model_id === filters.modelVersion);
    }

    // Local filter: Severity
    if (filter !== "all") {
      items = items.filter(i => i.severity_level === filter);
    }

    if (sortConfig !== null) {
      items.sort((a: any, b: any) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === undefined || bVal === undefined) return 0;
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [data, filter, sortConfig, filters]);

  const chartData = data.map(d => ({
    name: new Date(d.creation_date || d.timestamp || "").toLocaleDateString(),
    risk: d.total_risk * 100,
    confidence: d.confidence * 100
  })).reverse();

  const handleSort = (key: keyof EvaluationData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Governance Intelligence...</div>;

  return (
    <div className="space-y-8 animate-[fadeIn_.6s_ease-out]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Over Time */}
        <div className="card h-[350px]">
          <div className="card-header">
            <h3 className="card-title">Risk & Confidence Trend</h3>
            <p className="card-subtitle">Deterministic correlation matrix</p>
          </div>
          <div className="p-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  itemStyle={{ fontSize: '10px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="risk" stroke="var(--danger)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="confidence" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="card h-[350px]">
          <div className="card-header">
            <h3 className="card-title">Severity Distribution</h3>
            <p className="card-subtitle">Volume by risk classification</p>
          </div>
          <div className="p-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Critical', value: data.filter(d => d.severity_level === 'critical').length },
                { name: 'High', value: data.filter(d => d.severity_level === 'high').length },
                { name: 'Med', value: data.filter(d => d.severity_level === 'medium').length },
                { name: 'Low', value: data.filter(d => d.severity_level === 'low').length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-secondary)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--danger)' : 'var(--accent)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Evaluation Table */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h3 className="card-title">Governance Intelligence Log</h3>
            <p className="card-subtitle">Raw evaluation telemetry</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] text-[11px] font-mono px-3 py-1.5 rounded-lg outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort('interaction_id')}>Interaction ID</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort('severity_level')}>Severity</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort('total_risk')}>Risk Score</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort('confidence')}>Confidence</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest cursor-pointer hover:text-[var(--accent)]" onClick={() => handleSort('creation_date')}>Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-[var(--accent)]">{row.interaction_id}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      row.severity_level === 'critical' ? 'bg-red-900/40 text-red-500' :
                      row.severity_level === 'high' ? 'bg-orange-900/40 text-orange-500' :
                      row.severity_level === 'medium' ? 'bg-blue-900/40 text-blue-500' :
                      'bg-emerald-900/40 text-emerald-500'
                    }`}>
                      {row.severity_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">{(row.total_risk * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 text-xs font-mono">{(row.confidence * 100).toFixed(0)}%</td>
                  <td className="px-6 py-4 text-xs text-[var(--text-secondary)]">{new Date(row.creation_date || row.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
