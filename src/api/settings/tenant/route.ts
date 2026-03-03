import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

/**
 * Handles operations against Enterprise Tenant configurations.
 * Allows programmatic ingestion of UI overrides/settings mapping to `tenant_configs`, 
 * which automatically archives history rows to `tenant_config_versions` natively via PSQL Triggers.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) return NextResponse.json({ error: 'Tenant Organization ID Required' }, { status: 400 });

    const supabase = supabaseServer;

    // The RLS policy natively restricts the fetch if user token lacks group scopes
    const { data: config, error } = await supabase
      .from('tenant_configs')
      .select('settings, version, updated_at')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Tenant Config] GET failure:', error);
      return NextResponse.json({ error: 'Failed retrieving configurations.' }, { status: 500 });
    }

    // Default payload if missing overrides
    return NextResponse.json({ data: config || { settings: {}, version: 1 } }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgId, settingsOverrides } = body;

    // TODO: Verify user executing request holds valid Role mapped natively via their Token claims

    if (!orgId || !settingsOverrides) {
      return NextResponse.json({ error: 'Invalid Payload. Expected { orgId, settingsOverrides }.' }, { status: 400 });
    }

    const supabase = supabaseServer;

    // Relying on `auth.uid()` mapped cleanly into native sessions
    const { data: authData, error: authErr } = await supabase.auth.getUser();

    // Check pre-existing configuration status
    const { data: existingConfig } = await supabase
       .from('tenant_configs')
       .select('id, settings')
       .eq('org_id', orgId)
       .single();

    let result;

    if (existingConfig) {
      // Merge overrides atop historical context natively preserving unmentioned JSON properties
      const mergedSettings = { ...existingConfig.settings, ...settingsOverrides };
      
      const { data, error } = await supabase
        .from('tenant_configs')
        .update({ 
           settings: mergedSettings,
           updated_by: authData?.user?.id || null 
        })
        .eq('id', existingConfig.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create initial overlay setting
      const { data, error } = await supabase
        .from('tenant_configs')
        .insert({
           org_id: orgId,
           settings: settingsOverrides,
           updated_by: authData?.user?.id || null 
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Postgres trigger automatically records the transaction to `tenant_config_versions` natively
    return NextResponse.json({ success: true, version: result.version, data: result.settings }, { status: 200 });
    
  } catch (err: any) {
     console.error('[Tenant Config] POST execution failure:', err);
     return NextResponse.json({ error: 'Internal Server Error processing override.' }, { status: 500 });
  }
}
