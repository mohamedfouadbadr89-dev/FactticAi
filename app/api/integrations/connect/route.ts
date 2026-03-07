import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { SecurityLayer } from "@/lib/security/byok";
import { verifyProviderConnection } from "@/lib/integrations/verifyConnection";

export async function POST(req: NextRequest) {
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
    const hashedKey = SecurityLayer.secureKeyReference(apiKey);

    // 3. Org ID (hardcoded for demo/MVP as per existing patterns)
    const org_id = 'dbad3ca2-3907-4279-9941-8f55c3c0efdc';

    // 4. Persistence
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
