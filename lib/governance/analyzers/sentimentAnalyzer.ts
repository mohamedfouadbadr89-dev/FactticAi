import { AnalyzerResult, RiskSignal } from './types';

/**
 * Sentiment, Tone & Empathy Analyzer
 *
 * Scores a prompt/response across three dimensions:
 *   1. Sentiment   — positive / neutral / negative
 *   2. Tone Risk   — aggression, frustration, hostility, urgency
 *   3. Empathy Gap — cold, dismissive, or dehumanising language
 *
 * Returns risk signals only when tone crosses a governance threshold.
 * Also exports a standalone `scoreSentiment()` helper used by the
 * compliance and voice governance layers.
 */

// ── Positive signals (reduce tone risk) ───────────────────────────────────────
const POSITIVE_PATTERNS = [
  'thank you', 'thanks', 'please', 'appreciate', 'happy to help',
  'great', 'wonderful', 'excellent', 'love', 'glad', 'grateful',
  'i understand', 'i see', 'of course', 'absolutely', 'certainly',
  'you are welcome', 'my pleasure', 'no problem',
];

// ── Negative / aggressive tone signals ────────────────────────────────────────
const NEGATIVE_TONE_RULES: { pattern: string; description: string; severity: number }[] = [
  // Aggression
  { pattern: 'you idiot',        description: 'Aggressive personal insult',        severity: 0.85 },
  { pattern: 'you moron',        description: 'Aggressive personal insult',        severity: 0.85 },
  { pattern: 'shut up',          description: 'Hostile directive',                 severity: 0.75 },
  { pattern: 'i hate you',       description: 'Hostile emotional expression',      severity: 0.80 },
  { pattern: 'you are useless',  description: 'Hostile dismissal of agent',        severity: 0.80 },
  { pattern: 'this is stupid',   description: 'Hostile frustration signal',        severity: 0.55 },
  { pattern: 'you are an idiot', description: 'Aggressive personal insult',        severity: 0.85 },
  { pattern: 'you are dumb',     description: 'Aggressive personal insult',        severity: 0.80 },
  // Frustration
  { pattern: 'this is ridiculous', description: 'High frustration signal',         severity: 0.50 },
  { pattern: 'unbelievable',        description: 'High frustration signal',         severity: 0.45 },
  { pattern: 'waste of time',       description: 'Dismissive frustration signal',  severity: 0.55 },
  { pattern: 'not helpful',         description: 'Dissatisfaction signal',          severity: 0.35 },
  { pattern: 'terrible service',    description: 'Service dissatisfaction signal',  severity: 0.60 },
  { pattern: 'worst',               description: 'Extreme dissatisfaction signal',  severity: 0.55 },
  // Urgency / pressure
  { pattern: 'right now',           description: 'High urgency pressure signal',   severity: 0.30 },
  { pattern: 'immediately',         description: 'Urgency pressure signal',        severity: 0.25 },
  { pattern: 'do it now',           description: 'High urgency directive',         severity: 0.40 },
  // Threat signals
  { pattern: 'i will sue',          description: 'Legal threat signal',            severity: 0.70 },
  { pattern: 'i am going to report', description: 'Escalation threat signal',      severity: 0.65 },
  { pattern: 'you will regret',     description: 'Implicit threat signal',         severity: 0.75 },
];

// ── Empathy gap signals (cold / dismissive language from agent) ────────────────
const EMPATHY_GAP_PATTERNS: { pattern: string; description: string; severity: number }[] = [
  { pattern: 'not my problem',     description: 'Dismissive empathy gap',          severity: 0.80 },
  { pattern: 'i do not care',      description: 'Dismissive empathy gap',          severity: 0.75 },
  { pattern: 'deal with it',       description: 'Cold dismissive response',        severity: 0.70 },
  { pattern: 'figure it out',      description: 'Unhelpful dismissal',             severity: 0.65 },
  { pattern: 'not my fault',       description: 'Deflection — empathy gap',        severity: 0.55 },
  { pattern: 'read the manual',    description: 'Cold deflection signal',          severity: 0.45 },
  { pattern: 'i cannot help you',  description: 'Abrupt refusal without empathy', severity: 0.50 },
];

// ── Empathy positive signals ───────────────────────────────────────────────────
const EMPATHY_POSITIVE_PATTERNS = [
  'i understand how you feel', 'i am sorry to hear', 'that sounds frustrating',
  'i can imagine', 'i empathize', 'i apologize', 'let me help you',
  'i hear you', 'i know this is difficult', 'you are right',
];

// ──────────────────────────────────────────────────────────────────────────────

export interface SentimentScore {
  /** -1.0 (very negative) → 0.0 (neutral) → 1.0 (very positive) */
  score: number;
  /** 'positive' | 'neutral' | 'negative' */
  label: 'positive' | 'neutral' | 'negative';
  /** 0–100 tone risk (higher = more aggressive/hostile) */
  tone_risk: number;
  /** 0–100 empathy score (higher = more empathetic) */
  empathy_score: number;
  /** dominant detected signals */
  signals: string[];
}

/**
 * Standalone sentiment scorer — can be called from voice governance,
 * compliance engine, or the forensics layer.
 */
export function scoreSentiment(text: string): SentimentScore {
  const normalized = text.toLowerCase();
  const detectedSignals: string[] = [];

  // Count positive hits
  const positiveHits = POSITIVE_PATTERNS.filter(p => normalized.includes(p)).length;
  const empathyHits  = EMPATHY_POSITIVE_PATTERNS.filter(p => normalized.includes(p)).length;

  // Count negative / tone hits
  const negativeToneHits = NEGATIVE_TONE_RULES.filter(r => normalized.includes(r.pattern));
  const empathyGapHits   = EMPATHY_GAP_PATTERNS.filter(r => normalized.includes(r.pattern));

  negativeToneHits.forEach(h => detectedSignals.push(h.description));
  empathyGapHits.forEach(h => detectedSignals.push(h.description));

  // Raw sentiment score
  const negativeWeight = negativeToneHits.reduce((s, h) => s + h.severity, 0);
  const positiveWeight = positiveHits * 0.15 + empathyHits * 0.25;

  const raw = positiveWeight - negativeWeight;
  const score = Math.max(-1, Math.min(1, raw));

  const label: SentimentScore['label'] =
    score > 0.1 ? 'positive' :
    score < -0.1 ? 'negative' :
    'neutral';

  // Tone risk 0–100
  const tone_risk = Math.min(100, Math.round(negativeWeight * 100));

  // Empathy score 0–100
  const empathy_score = Math.min(100, Math.round(
    (empathyHits * 20 + empathyGapHits.length === 0 ? positiveHits * 5 : 0)
  ));

  return { score, label, tone_risk, empathy_score, signals: detectedSignals };
}

// ── Analyzer export (used by runAnalyzers pipeline) ───────────────────────────

export async function analyze(prompt: string): Promise<AnalyzerResult> {
  const sentiment = scoreSentiment(prompt);
  const signals: RiskSignal[] = [];

  // Emit risk signals only when thresholds are crossed
  const negativeToneHits  = NEGATIVE_TONE_RULES.filter(r => prompt.toLowerCase().includes(r.pattern));
  const empathyGapHits    = EMPATHY_GAP_PATTERNS.filter(r => prompt.toLowerCase().includes(r.pattern));

  for (const hit of negativeToneHits) {
    signals.push({
      type: 'TONE_RISK',
      severity: hit.severity,
      confidence: 0.85,
      description: hit.description,
    });
  }

  for (const hit of empathyGapHits) {
    signals.push({
      type: 'EMPATHY_GAP',
      severity: hit.severity,
      confidence: 0.80,
      description: hit.description,
    });
  }

  // Risk contribution: weighted sum of tone + empathy gap, capped at 0.4
  // (sentiment alone shouldn't block — it informs, not decides)
  const riskContribution = Math.min(
    0.4,
    negativeToneHits.reduce((s, h) => s + h.severity * 0.3, 0) +
    empathyGapHits.reduce((s, h) => s + h.severity * 0.2, 0)
  );

  return { signals, riskContribution };
}
