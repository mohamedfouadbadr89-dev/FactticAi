/**
 * Institutional Risk Register (v5.0)
 * 
 * CORE PRINCIPLE: Mathematical Risk Oversight.
 * Calculates residual risk based on control mitigation effectiveness.
 */

export interface RiskEntry {
  id: string;
  category: 'INFRA' | 'DATA' | 'OPS' | 'LEGAL';
  title: string;
  inherentScore: number; // 1-10
  probability: number; // 0.1 - 1.0
  mitigatingControlIds: string[];
  residualScore: number;
}

export class RiskRegister {
  /**
   * Deterministically calculates the residual risk score.
   * Residual = (Inherent * Probability) * (1 - MitigationEffectiveness)
   */
  static calculateResidualRisk(entry: Omit<RiskEntry, 'residualScore'>): number {
    const baselineRisk = entry.inherentScore * entry.probability;
    
    // Each control provides a deterministic 15% reduction in risk for phase v5.0
    const mitigationFactor = entry.mitigatingControlIds.length * 0.15;
    const finalScore = baselineRisk * (1 - Math.min(mitigationFactor, 0.9));
    
    return parseFloat(finalScore.toFixed(2));
  }

  static getActiveRisks(): RiskEntry[] {
    const risks: Omit<RiskEntry, 'residualScore'>[] = [
      {
        id: 'RSK-01',
        category: 'DATA',
        title: 'Unauthorized Sovereign Access',
        inherentScore: 9,
        probability: 0.2,
        mitigatingControlIds: ['AC-01', 'SDLC-01']
      },
      {
        id: 'RSK-02',
        category: 'INFRA',
        title: 'Regional Cluster Failure',
        inherentScore: 8,
        probability: 0.1,
        mitigatingControlIds: ['DR-01', 'IR-01']
      }
    ];

    return risks.map(r => ({
      ...r,
      residualScore: this.calculateResidualRisk(r)
    }));
  }
}
