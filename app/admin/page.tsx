import { createServerAuthClient } from '@/lib/supabaseAuth'
import { resolveOrgContext } from '@/lib/orgResolver'
import { redirect } from 'next/navigation'
import SuperAdminClientView from './SuperAdminClient'
import { ArrowRight } from 'lucide-react'
import React from 'react'

export default async function SuperAdminDashboard() {

  // Server-side Protection Check
  const supabase = await createServerAuthClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { role } = await resolveOrgContext(session.user.id)

  // Only owner or admin
  if (role !== 'admin' && role !== 'owner') {
    redirect('/dashboard')
  }

  return <SuperAdminClientView />
}


function PillarCard({
  icon,
  title,
  description,
  metric,
  label
}: {
  icon: React.ReactNode
  title: string
  description: string
  metric: number
  label: string
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl p-6 hover:border-[#444] transition-all group">

      <div className="flex items-center gap-3 mb-6">

        <div className="p-2 bg-[#111] rounded-lg border border-[#2d2d2d]">
          {icon}
        </div>

        <h2 className="text-xs font-black uppercase tracking-widest">
          {title}
        </h2>

      </div>

      <p className="text-[10px] text-[#555] font-mono leading-relaxed mb-4">
        {description}
      </p>

      <div className="flex items-end justify-between border-t border-[#2d2d2d] pt-4">

        <div>
          <p className="text-[9px] font-black text-[#333] uppercase">
            {label}
          </p>

          <p className="text-lg font-black">
            {metric}
          </p>
        </div>

        <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-white transition-colors" />

      </div>

    </div>
  )
}