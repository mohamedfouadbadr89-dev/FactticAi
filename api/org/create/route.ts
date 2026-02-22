import { supabaseServer } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

/**
 * API Org Create
 * 
 * Endpoint to register new organizations.
 * LEVEL 1 Execution.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('organizations')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
