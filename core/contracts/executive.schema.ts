import { z } from 'zod'

export const ExecutiveStateSchema = z.object({
  org_id: z.string(),
  generated_at: z.string(),
  metrics: z.object({
    governance_score: z.number(),
    drift: z.number(),
    sessions_30d: z.number(),
    active_alerts: z.number(),
  }),
  risk_state: z.enum(['LOW','MEDIUM','CRITICAL','SOVEREIGN']),
  isolation_state: z.enum(['LOCKED','BREACHED']),
  integrity_ok: z.boolean(),
})

export type ExecutiveStateValidated = z.infer<typeof ExecutiveStateSchema>