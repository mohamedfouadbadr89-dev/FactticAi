export interface RiskSignal {
  type: string;
  severity: number;
  confidence: number;
  description: string;
}

export interface AnalyzerResult {
  signals: RiskSignal[];
  riskContribution: number;
}
