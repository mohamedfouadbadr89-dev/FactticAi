import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

/**
 * Handles SSO Initiation and Callback flows for Enterprise Organizations
 * Integrates directly with Supabase Identity mapping to SAML/OIDC identity providers.
 */
export async function POST(req: Request) {
  try {
    const { domain, provider } = await req.json();

    if (!domain) {
      return NextResponse.json({ error: 'Corporate email domain is required for SSO.' }, { status: 400 });
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Initialize the SSO flow aiming for SAML or OIDC via Supabase
    const { data, error } = await supabase.auth.signInWithSSO({
      domain,
      options: {
        redirectTo: `${new URL(req.url).origin}/api/auth/callback`,
      },
    });

    if (error) {
       logger.error('[SSO Auth] Flow Initiation Failed:', error);
       return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data?.url) {
      // Return the URL for the frontend application to redirect the client to their Identity Provider (e.g. Okta, Azure)
      return NextResponse.json({ url: data.url }, { status: 200 });
    }

    return NextResponse.json({ error: 'SSO flow did not return a valid redirect URL.' }, { status: 500 });
  } catch (err: any) {
    logger.error('[SSO Auth] Internal Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
