import { createServerAuthClient } from '@/lib/supabaseAuth';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerAuthClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const { user } = session;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    organization: {
      // For now, derive role from metadata if present
      role: user.user_metadata?.role || 'viewer'
    }
  });
}
