import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { SecurityLayer } from "@/lib/security/byok";
import { verifyProviderConnection } from "@/lib/integrations/verifyConnection";
import { withAuth, AuthContext } from "@/lib/middleware/auth";

/**
 * POST /api/integrations/connect
 * Securely persists dynamic AI infrastructure configurations.
 * Enforces BYOK (Bring Your Own Key) via SHA-256 reference hashing.
 */
export const POST = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    const body = await req.json();
    const { provider, apiKey, model, environment, mode } = body;

    // 1. Validation
    if (!provider || !apiKey || !model) {
      return NextResponse.json({ error: "Missing required configuration fields." }, { status: 400 });
    }

    // 2. Pre-save Verification
    const verification = await verifyProviderConnection(provider, body);
    if (!verification.success) {
      return NextResponse.json({ 
        error: verification.message,
        details: "Facttic cannot authenticate with the provider using these credentials." 
      }, { status: 401 });
    }

    // 3. Hash raw key via Security Layer (BYOK enforcement)
    // We never store the raw key.
    const hashedKey = SecurityLayer.secureKeyReference(apiKey);

    // 4. Persistence
    if (body.webhook_secret && mode === 'voice') {
      await supabaseServer
        .from('external_integrations')
        .upsert({
          org_id: orgId,
          provider,
          webhook_secret: body.webhook_secret,
          status: 'active'
        }, { onConflict: 'org_id,provider' });
    }

    const { error } = await supabaseServer
      .from('ai_connections')
      .insert({
        org_id: orgId,
        provider_type: provider,
        interaction_mode: mode || 'chat',
        model,
        api_key_hash: hashedKey,
        environment
      });

    if (error) {
      console.error('PERSISTENCE_ERROR:', error);
      return NextResponse.json({ error: "Failed to persist AI connection." }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('CONNECTION_WIZARD_API_ERROR:', err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
});
