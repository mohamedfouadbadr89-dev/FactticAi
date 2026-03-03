'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  UserPlus, 
  MoreVertical, 
  Trash2, 
  ShieldCheck, 
  Mail,
  Loader2
} from 'lucide-react';
import { logger } from '@/lib/logger';

interface UserMember {
  membership_id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  job_title: string | null;
  department: string | null;
  joined_at: string;
}

export default function AccessControlClient() {
  const [users, setUsers] = useState<UserMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('analyst');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) {
        if (res.status === 403) throw new Error('Requires Administrative Priveleges.');
        throw new Error('Failed to fetch institutional members.');
      }
      const data = await res.json();
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to dispatch invitation.');
      }
      setInviteEmail('');
      await fetchUsers(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole })
      });
      if (!res.ok) throw new Error('Failed to update role.');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently revoke this user\'s access to the governance mesh?')) return;
    try {
      const res = await fetch(`/api/users/${userId}/role`, { // actually hitting DELETE /api/users/[id] but Next.js route is same folder
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to revoke access.');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_.4s_ease-in-out]">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center gap-3">
          <ShieldAlert className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Invite Section */}
      <section className="card p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--border-primary)] pb-4">
          <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Provision Identity</h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium">Invite new analysts or administrators to the governance mesh.</p>
          </div>
        </div>
        
        <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] block">Target Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="email" 
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="analyst@institution.com"
                className="w-full pl-11 p-3.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-sm focus:border-[var(--accent)] focus:ring-4 ring-[var(--accent)]/5 transition-all outline-none"
              />
            </div>
          </div>
          <div className="w-full md:w-64 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] block">Initial Standing</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full pl-11 p-3.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-sm focus:border-[var(--accent)] focus:ring-4 ring-[var(--accent)]/5 transition-all outline-none appearance-none"
              >
                <option value="viewer">VIEWER (Read Only)</option>
                <option value="analyst">ANALYST (Standard)</option>
                <option value="admin">ADMIN (Elevated)</option>
              </select>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={inviting || !inviteEmail}
            className="w-full md:w-auto bg-[var(--accent)] text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dispatch Invite'}
          </button>
        </form>
      </section>

      {/* Directory Section */}
      <section className="card overflow-hidden">
        <div className="p-6 border-b border-[var(--border-primary)] flex items-center gap-3">
          <Users className="w-5 h-5 text-[var(--text-secondary)]" />
          <h2 className="text-lg font-bold tracking-tight">Institutional Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Standing</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Department</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] whitespace-nowrap">Inducted</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="font-bold text-[var(--text-primary)]">{u.full_name || 'Pending Invite'}</div>
                    <div className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                      disabled={u.role === 'owner'}
                      className="bg-transparent border border-[var(--border-primary)] rounded-lg text-xs font-bold uppercase tracking-widest px-3 py-1.5 focus:border-[var(--accent)] outline-none disabled:opacity-50"
                    >
                      <option value="owner" disabled>OWNER</option>
                      <option value="admin">ADMIN</option>
                      <option value="analyst">ANALYST</option>
                      <option value="viewer">VIEWER</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)] text-xs font-medium">
                    {u.department || 'Unassigned'}
                    {u.job_title && <div className="text-[10px] uppercase opacity-70 mt-1">{u.job_title}</div>}
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)] text-xs font-mono">
                    {new Date(u.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRemove(u.user_id)}
                      disabled={u.role === 'owner'}
                      className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-20"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-secondary)] font-medium">
                    No institutional members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
