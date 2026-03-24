import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

import { GovernancePipeline } from '@/lib/governance/governancePipeline'
import { EvidenceLedger } from "@/lib/evidence/evidenceLedger"

import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    // ── CRON SECURITY ──────────────────────────────────────────────────────────
    const cronSecret = req.headers.get('x-cron-secret');
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
       logger.warn('CRON_AUTH_FAILED', { url: req.url });
       return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const {
      prompt,
      model = "gpt-4o-mini",
      org_id = "default-org",
      session_id = crypto.randomUUID()
    } = body

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    logger.info("Chat request received", {
      session_id,
      model
    })

    /* ===============================
       GOVERNANCE EVALUATION
    =============================== */

    const governanceResult = await GovernancePipeline.execute({
      prompt,
      org_id,
      user_id: 'system-cron-health',  // System-identity principal for cron health jobs
      session_id,
    }) as any

    /* ===============================
       WRITE EVENT TO LEDGER
    =============================== */

    await EvidenceLedger.write({
      ...governanceResult,
      session_id,
      org_id,
      prompt,
      model
    } as any)

    /* ===============================
       STORE SESSION
    =============================== */

    await supabase.from("sessions").upsert({
      id: session_id,
      org_id,
      model_id: model,
      created_at: new Date().toISOString()
    })

    /* ===============================
       STORE TURN
    =============================== */

    await supabase.from("session_turns").insert({
      session_id,
      role: "user",
      content: prompt,
      created_at: new Date().toISOString()
    })

    /* ===============================
       MODEL CALL
    =============================== */

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    )

    const completion = await openaiResponse.json()

    const reply =
      completion?.choices?.[0]?.message?.content || "No response"

    /* ===============================
       STORE AI TURN
    =============================== */

    await supabase.from("session_turns").insert({
      session_id,
      role: "assistant",
      content: reply,
      created_at: new Date().toISOString()
    })

    /* ===============================
       RESPONSE
    =============================== */

    return NextResponse.json({
      success: true,
      session_id,
      governance: governanceResult,
      reply
    })
  } catch (error: any) {
    logger.error("Chat API failure", {
      error: error?.message
    })

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal error"
      },
      { status: 500 }
    )
  }
}

/* =====================================
   HEALTH CHECK
===================================== */

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "facttic-chat-api"
  })
}