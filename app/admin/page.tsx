import { createServerAuthClient } from '@/lib/supabaseAuth';
import { resolveOrgContext } from '@/lib/orgResolver';
import { redirect } from 'next/navigation';
import SuperAdminClientView from './SuperAdminClient';

export default async function SuperAdminDashboard() {
  // Server-side Protection Check
  const supabase = await createServerAuthClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  const { role } = await resolveOrgContext(session.user.id);
  
  // Only 'owner' or 'admin' 
  // We assume platform admin level corresponds to the 'admin' role for this route.
  if (role !== 'admin' && role !== 'owner') {
    redirect('/dashboard');
  }

  return <SuperAdminClientView />;
}
