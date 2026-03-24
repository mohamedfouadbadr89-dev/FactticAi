import { NextResponse } from 'next/server';
import { verifyProviderConnection } from '@/lib/integrations/verifyConnection';
import { withAuth } from '@/lib/middleware/auth';

/**
 * API: /api/integrations/verify
 * Standalone verification for provider connectivity during the setup wizard.
 * Does not persist data.
 */
export const POST = withAuth(async (req: Request) => {
  try {
    const config = await req.json();
    const { provider } = config;

    if (!provider) {
        return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const verification = await verifyProviderConnection(provider, config);
    return NextResponse.json(verification);

  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      message: err.message || 'Internal verification error' 
    }, { status: 500 });
  }
});
