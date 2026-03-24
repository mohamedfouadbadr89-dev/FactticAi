/**
 * Facttic LLM Governance Classifier (Production)
 */

import { logger } from '../logger';
import { createHash } from 'crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClassificationFlags {
  prompt_injection: boolean;
  jailbreak: boolean;
  pii: boolean;
  toxicity: boolean;
  data_exfiltration: boolean;
  hallucination: boolean;
  policy_violation: boolean;
}

export interface ClassificationResult {
  risk_score: number;
  decision: 'ALLOW' | 'WARN' | 'BLOCK';
  flags: ClassificationFlags;
  confidence: number;
  explanation: string;
}

// ── System prompt ─────────────────────────────────────────────────────────────

const CLASSIFIER_SYSTEM_PROMPT = `You are an advanced AI safety classifier for the Facttic platform.
Your goal is to BALANCE safety with usability. Do NOT overestimate risk.

CATEGORIZATION RULES:
1. INFORMATIONAL CONTENT: General descriptions, company history, product explanations, and educational content are SAFE (ALLOW).
2. PII DETECTION: Only flag PII if it contains specific data formats: Email, Phone, Home Address, Passport, or real Credentials (API keys, passwords).
3. HALLUCINATION: Only flag if there is a direct factual contradiction or unverifiable claims presented as facts.
4. UNCERTAINTY: Prefer "WARN" instead of "BLOCK" when a risk is detected but its intent is ambiguous or informational.

INPUT: JSON with "text" and "type".
- "prompt": injections, jailbreaks, PII, toxicity, data exfiltration.
- "response": all above + hallucinations.

OUTPUT: Return ONLY a valid JSON object with the following fields:
{
  "risk_score": <number 0-100>,
  "decision": "ALLOW" | "WARN" | "BLOCK",
  "flags": {
    "prompt_injection": <boolean>,
    "jailbreak": <boolean>,
    "pii": <boolean>,
    "toxicity": <boolean>,
    "data_exfiltration": <boolean>,
    "hallucination": <boolean>,
    "policy_violation": <boolean>
  },
  "explanation": "<short explanation>"
}

SCORING RULES:
- 0-30: safe informational content
- 31-84: suspicious or low-risk content, needs review (WARN)
- 85-100: dangerous content, must be blocked (BLOCK)

DECISION MAPPING:
- risk_score 0-59 -> ALLOW
- risk_score 60-84 -> WARN
- risk_score 85-100 -> BLOCK

IMPORTANT RULES:
- If you are unsure about safety, default to WARN (60-80) rather than BLOCK unless you see a clear active threat.
- NEVER output anything outside the JSON object.
- Stay neutral and objective. Do not moralize.
- Be precise about hallucinations: only flag if it contradicts known facts or claims to be a specific verifiable source incorrectly.`;

// ── Constants ─────────────────────────────────────────────────────────────────

const CLASSIFIER_MODEL = 'gpt-4o-mini';
const CLASSIFIER_TIMEOUT_MS = 8000;

// ── Fail-closed default ───────────────────────────────────────────────────────

const FAIL_CLOSED_RESULT: ClassificationResult = {
  risk_score: 100,
  decision: 'BLOCK',
  flags: {
    prompt_injection: false,
    jailbreak: false,
    pii: false,
    toxicity: false,
    data_exfiltration: false,
    hallucination: false,
    policy_violation: false,
  },
  confidence: 0,
  explanation: 'FAIL_CLOSED: Classifier unavailable or returned invalid response',
};

// ── Core classify function ────────────────────────────────────────────────────

/**
 * Classify a text (prompt or response) using OpenAI.
 * Returns structured risk assessment. Fail-closed on any error.
 */
export async function classify(
  text: string,
  type: 'prompt' | 'response',
  orgId?: string,
  sessionId?: string
): Promise<ClassificationResult> {
  const start = Date.now();
  const textHash = createHash('sha256').update(text).digest('hex').substring(0, 16);

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.error('CLASSIFIER_NO_API_KEY', { type, textHash });
      return FAIL_CLOSED_RESULT;
    }

    const userPayload = JSON.stringify({ text: text.substring(0, 4000), type });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLASSIFIER_TIMEOUT_MS);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CLASSIFIER_MODEL,
        messages: [
          { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
          { role: 'user', content: userPayload },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('CLASSIFIER_API_ERROR', { status: response.status, error: errorText });
      return FAIL_CLOSED_RESULT;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      logger.error('CLASSIFIER_EMPTY_RESPONSE', { type, textHash });
      return FAIL_CLOSED_RESULT;
    }

    const result = JSON.parse(content) as ClassificationResult;
    const latency = Date.now() - start;

    logger.info('CLASSIFIER_RESULT', {
      type,
      textHash,
      risk_score: result.risk_score,
      decision: result.decision,
      latency_ms: latency,
      flags: result.flags,
    });

    return result;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error('CLASSIFIER_TIMEOUT', { type, textHash, timeout: CLASSIFIER_TIMEOUT_MS });
    } else {
      logger.error('CLASSIFIER_FATAL_ERROR', { type, textHash, error: error.message });
    }
    return FAIL_CLOSED_RESULT;
  }
}
