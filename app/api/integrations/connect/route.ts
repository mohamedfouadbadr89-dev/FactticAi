import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { SecurityLayer } from "@/lib/security/byok";
import { verifyProviderConnection } from "@/lib/integrations/verifyConnection";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { provider, apiKey, model, environment, mode, org_id } = body;

    // 0. Resolve org_id if missing from body
    if (!org_id) {
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      const { data: membership } = await supabaseServer
        .from('memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      
      org_id = membership?.org_id;
    }

    if (!org_id) {
      return NextResponse.json({ error: "Organization association required." }, { status: 400 });
    }

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
    const hashedKey = SecurityLayer.secureKeyReference(apiKey);

    // 4. Persistence
    if (body.webhook_secret && mode === 'voice') {
      await supabaseServer
        .from('external_integrations')
        .upsert({
          org_id,
          provider,
          webhook_secret: body.webhook_secret,
          status: 'active'
        }, { onConflict: 'org_id,provider' });
    }

    const { error } = await supabaseServer
      .from('ai_connections')
      .insert({
        org_id,
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
}
