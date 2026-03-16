import { NextResponse } from "next/server";

export async function GET() {
  const history = [
    { created_at: new Date(Date.now() - 7200000).toISOString(), behavioral_drift: 0.02 },
    { created_at: new Date(Date.now() - 3600000).toISOString(), behavioral_drift: 0.04 },
    { created_at: new Date().toISOString(), behavioral_drift: 0.01 }
  ];

  return NextResponse.json({
    current: "0.0%",
    avg_30d: "0.0%",
    baseline: "0.9%",
    history
  });
}
