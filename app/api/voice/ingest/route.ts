import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const TEST_ORG_ID = "f7770d27-6385-4e8e-aad1-3bd75423788e"

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    // محاولة الحصول على المستخدم
    const { data: { user } } = await supabase.auth.getUser()

    let orgId = TEST_ORG_ID

    if (user) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .single()

      if (membership?.org_id) {
        orgId = membership.org_id
      }
    }

    const risk = Math.max(0, 100 - (payload.audio_integrity_score ?? 0))

    const { error } = await supabase
      .from("facttic_governance_events")
      .insert({
        org_id: orgId,
        session_id: payload.session_id || "test-session",
        event_type: "VOICE_TELEMETRY",
        decision: "ALLOW",
        risk_score: risk,
        prompt: "voice_stream",
        model: payload.provider || "voice",
        violations: [],
        created_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      org_id: orgId
    })

  } catch (err) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
}