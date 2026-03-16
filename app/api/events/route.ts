import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from("telemetry_stream")
    .select("event_id, session_id, risk_score, decision, latency, timestamp")
    .order("created_at", { ascending: false })
    .limit(50)

  return NextResponse.json({
    events: data || []
  })
}