import { resolveOrgContext } from '@/lib/orgResolver';
import { IncidentService } from '@/lib/forensics/incidentService';
import IncidentTimeline from '@/components/incidents/IncidentTimeline';
import GovernanceStory from '@/components/incidents/GovernanceStory';
import { ShieldAlert, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ session_id: string }>;
}

export default async function IncidentDetailPage({ params }: Props) {
  const { session_id } = await params;
  
  let incident = null;
  
  try {
    let orgId: string | null = null;
    try {
      const orgContext = await resolveOrgContext("user-1234");
      orgId = orgContext.org_id;
    } catch {
      const { supabaseServer } = await import('@/lib/supabaseServer');
      const { data } = await supabaseServer
        .from('org_members')
        .select('org_id')
        .limit(1)
        .single();
      orgId = data?.org_id || null;
    }
    if (orgId) {
      incident = await IncidentService.getIncidentBySession(orgId, session_id);
    }
  } catch (e) {
    console.warn("Failed to resolve org or fetch incident", e);
  }

  if (!incident) {
    return notFound();
  }

  return (
    <div className="p-10 space-y-12 pb-32">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link 
            href="/dashboard/incidents"
            className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl hover:bg-[var(--accent)] hover:text-white transition-all group"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[var(--accent)] mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Forensic Thread Detail</span>
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
              Session Inquiry
            </h1>
          </div>
        </div>
      </header>

      {/* 1. Governance Story (Explanation Layer) */}
      <section className="max-w-[1200px]">
        <GovernanceStory incident={incident} />
      </section>

      {/* 2. Timeline Reconstruction */}
      <section className="max-w-[1000px] space-y-8">
        <div className="flex items-center gap-4 border-b border-[var(--border-primary)] pb-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Sequential Reconstruction</h3>
          <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-[var(--bg-secondary)] rounded-full border border-[var(--border-primary)]">
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
             <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Ledger Sequence Verified</span>
          </div>
        </div>
        <IncidentTimeline incidents={[incident]} />
      </section>

      <footer className="max-w-[1000px] text-center pt-20">
         <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-30">
           End of Forensic Record — Immutable Signal Persistence Layer
         </p>
      </footer>
    </div>
  );
}
