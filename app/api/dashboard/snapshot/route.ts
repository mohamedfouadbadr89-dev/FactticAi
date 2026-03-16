import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"
import { logger } from "@/lib/logger"

export async function GET() {

  try {

    const { data, error } = await supabaseServer
      .from("facttic_governance_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      logger.error("SNAPSHOT_QUERY_FAILED", error)

      return NextResponse.json({
        health: { avg_risk: 0, max_risk: 0, total_events: 0 },
        alerts: [],
        incidents: [],
        telemetry: [],
        forensics: [],
        drift: {}
      })
    }

    const events = data ?? []

    const totalEvents = events.length

    const avgRisk =
      totalEvents > 0
        ? events.reduce((sum, e) => sum + (e?.risk_score || 0), 0) / totalEvents
        : 0

    const maxRisk =
      totalEvents > 0
        ? Math.max(...events.map(e => e?.risk_score || 0))
        : 0

    return NextResponse.json({
      health: {
        avg_risk: avgRisk,
        max_risk: maxRisk,
        total_events: totalEvents
      },
      alerts: [],
      incidents: [],
      telemetry: events,
      forensics: events,
      drift: {}
    })

  } catch (err) {

    logger.error("SNAPSHOT_FATAL_ERROR", err)

    return NextResponse.json({
      health: { avg_risk: 0, max_risk: 0, total_events: 0 },
      alerts: [],
      incidents: [],
      telemetry: [],
      forensics: [],
      drift: {}
    })

  }

}
