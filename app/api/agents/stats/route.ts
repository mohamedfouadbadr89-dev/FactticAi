import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';

export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    // 1. Fetch sessions for the organization
    const { data: sessions, error: sessError } = await supabaseServer
      .from('agent_sessions')
      .select('status, risk_score, steps')
      .eq('org_id', orgId);

    if (sessError) {
      // If table doesn't exist yet, return empty but valid structure
      if (sessError.code === '42P01') {
        return NextResponse.json({
          stats: [
            { name: 'Active Agents', value: 0, icon: 'Bot', color: '#3b82f6' },
            { name: 'Total Steps (24h)', value: 0, icon: 'Activity', color: '#10b981' },
            { name: 'Blocked Tools', value: 0, icon: 'ShieldX', color: '#ef4444' },
            { name: 'Avg Risk Score', value: 0, icon: 'ShieldAlert', color: '#f59e0b' },
          ],
          radar: [],
          tools: []
        });
      }
      throw sessError;
    }

    // 2. Compute basic stats
    const activeCount = sessions?.filter(s => s.status === 'running').length || 0;
    const totalSteps = sessions?.reduce((acc, s) => acc + (s.steps || 0), 0) || 0;
    const blockedCount = sessions?.filter(s => s.status === 'blocked').length || 0;
    const avgRisk = sessions?.length ? sessions.reduce((acc, s) => acc + (s.risk_score || 0), 0) / sessions.length : 0;

    const stats = [
      { name: 'Active Agents', value: activeCount, icon: 'Bot', color: '#3b82f6' },
      { name: 'Total Steps (24h)', value: totalSteps, icon: 'Activity', color: '#10b981' },
      { name: 'Blocked Tools', value: blockedCount, icon: 'ShieldX', color: '#ef4444' },
      { name: 'Avg Risk Score', value: parseFloat(avgRisk.toFixed(1)), icon: 'ShieldAlert', color: '#f59e0b' },
    ];

    // 3. Fetch tool trigger counts (from agent_steps)
    // We group by tool_name and count
    const { data: toolStats, error: toolError } = await supabaseServer
      .from('agent_steps')
      .select('tool_name')
      .not('tool_name', 'is', null);
    
    const toolCounts: Record<string, number> = {};
    toolStats?.forEach(s => {
      if (s.tool_name) toolCounts[s.tool_name] = (toolCounts[s.tool_name] || 0) + 1;
    });

    const topTools = Object.entries(toolCounts)
      .map(([name, usage]) => ({ name, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 4);

    // 4. Heatmap/Radar data
    // We can compute this from action_type or risk categories if we had them.
    // For now, let's just return real zeros or a simplified real version.
    const radar = [
      { subject: 'Tool Misuse', A: (sessions?.filter(s => (s.risk_score || 0) > 80).length || 0) * 10, fullMark: 100 },
      { subject: 'Looping', A: (sessions?.filter(s => (s.steps || 0) > 50).length || 0) * 5, fullMark: 100 },
      { subject: 'Data Leak', A: 0, fullMark: 100 },
      { subject: 'API Poison', A: 0, fullMark: 100 },
      { subject: 'Hallucin.', A: (sessions?.filter(s => (s.risk_score || 0) > 40 && (s.risk_score || 0) < 80).length || 0) * 2, fullMark: 100 },
    ];

    return NextResponse.json({ stats, radar, tools: topTools });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
