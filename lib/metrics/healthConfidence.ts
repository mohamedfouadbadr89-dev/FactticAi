/**
 * Health Confidence Modifier
 * 
 * CORE PRINCIPLE: Prevent the "100% success paradox" in low-volume environments.
 * This logic adjusts the perceived governance maturity based on statistical significance.
 */

export function computeHealthConfidence(signalCount: number): number {
  if (signalCount > 1000) return 1.0;
  if (signalCount > 500) return 0.9;
  if (signalCount > 100) return 0.8;
  if (signalCount > 50) return 0.7;
  return 0.6;
}
