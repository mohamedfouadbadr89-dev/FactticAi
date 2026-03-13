'use client';

import React, { useEffect, useState } from 'react';

interface RiskScore {
  id: string;
  conversation_id: string;
  org_id: string;
  risk_score: number;
  flagged_policies: string[];
  created_at: string;
}

export default function VoiceRiskScorePanel({ conversationId, orgId }: { conversationId: string; orgId: string }) {
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!conversationId || !orgId) return;

    const fetchScores = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/voice/riskScores?conversationId=${conversationId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setScores([]);
            return;
          }
          throw new Error('Failed to fetch risk scores');
        }

        const data = await response.json();
        setScores(data.riskScores || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [conversationId, orgId]);

  if (loading) return <div className="p-4 text-gray-500" data-testid="risk-panel-loading">Loading risk analysis...</div>;
  if (error) return <div className="p-4 text-red-500" data-testid="risk-panel-error">Error: {error}</div>;
  if (scores.length === 0) return <div className="p-4 text-gray-500" data-testid="risk-panel-empty">No risk scores available for this conversation.</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" data-testid="voice-risk-score-panel">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Voice Conversation Risk Analysis</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Flagged Policies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {scores.map((score) => (
              <tr key={score.id} data-testid={`risk-score-row-${score.id}`}>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{new Date(score.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-sm">
                  <span className={`px-2 py-1 rounded text-white ${score.risk_score > 75 ? 'bg-red-500' : score.risk_score > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}>
                    {score.risk_score}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {score.flagged_policies.length > 0 ? score.flagged_policies.join(', ') : 'None'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
