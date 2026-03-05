"use client";

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Users, CheckCircle2, Search, Filter, MoreVertical, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  session_id: string;
  risk_score: number;
  status: 'pending' | 'reviewing' | 'resolved';
  reviewer_id?: string;
  resolution_notes?: string;
  created_at: string;
}

export default function ReviewQueuePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`/api/governance/reviews${statusParam}`);
      const data = await res.json();
      setReviews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (score >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              <h1 className="text-3xl font-bold tracking-tight">Forensic Review Queue</h1>
            </div>
            <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">Human-in-the-Loop Governance Auditing</p>
          </div>
          
          <div className="flex items-center gap-4 bg-[#0a0a0a] border border-slate-800 p-1 rounded-xl">
             {['all', 'pending', 'reviewing', 'resolved'].map(f => (
               <button 
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 {f}
               </button>
             ))}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 bg-black/40 flex justify-between items-center">
             <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search by session ID..." 
                  className="bg-black border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-700 w-64"
                />
             </div>
             <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                  <Filter className="w-4 h-4 text-slate-500" />
                </button>
             </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                <th className="px-6 py-4 font-medium">Session Identity</th>
                <th className="px-6 py-4 font-medium text-center">Risk Intensity</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Assigned Auditor</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="h-16 px-6">
                      <div className="h-4 bg-slate-900 rounded w-full opacity-50"></div>
                    </td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                       <CheckCircle2 className="w-8 h-8" />
                       <p className="text-sm">No pending forensic reviews</p>
                    </div>
                  </td>
                </tr>
              ) : reviews.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{r.session_id}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getRiskColor(r.risk_score)}`}>
                      {(r.risk_score).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                       <div className={`px-2 py-1 rounded-full text-[10px] capitalize font-medium ${
                         r.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 
                         r.status === 'reviewing' ? 'bg-blue-500/10 text-blue-400' : 
                         'bg-slate-500/10 text-slate-400'
                       }`}>
                         {r.status}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center items-center gap-2">
                       {r.reviewer_id ? (
                         <>
                           <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                             <Users className="w-3 h-3 text-slate-400" />
                           </div>
                           <span className="text-xs text-slate-300 font-mono italic">auditor_01</span>
                         </>
                       ) : (
                         <span className="text-[10px] text-slate-600 italic">Unassigned</span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800 rounded-lg">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 flex justify-between items-center text-[10px] text-slate-600 font-mono uppercase tracking-widest">
           <div>Total Queue Depth: {reviews.length}</div>
           <div>Facttic Governance Protocol v1.4</div>
        </div>
      </div>
    </div>
  );
}
