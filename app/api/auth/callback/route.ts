import { createServerAuthClient } from '@/lib/supabaseAuth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createServerAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Fallback if there is an error exchanging the code
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
}
