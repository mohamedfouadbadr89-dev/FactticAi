export interface TurnRiskScore {
  total_risk: number
  factors: Record<string, any>
  confidence: number
  timestamp: string
  creation_date?: string
  model_id?: string
}