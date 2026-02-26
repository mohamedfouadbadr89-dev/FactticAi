export interface TurnRiskScore {
  total_risk: number
  factors: Record<string, any>
  confidence: number
  timestamp: string
}