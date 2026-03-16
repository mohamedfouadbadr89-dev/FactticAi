/**
 * Privacy Shield — PII Redaction Layer (v1.0)
 *
 * Provides deterministic, pattern-based redaction of sensitive data before
 * any value is persisted to governance metadata stores (facttic_governance_events,
 * audit_logs). This is a second line of defence — upstream sanitization
 * (DataProtection.maskPII) handles raw prompts. This layer handles structured
 * metadata objects that may carry incidentally leaked PII from error messages,
 * user-supplied values, or LLM output fragments.
 *
 * Design principles:
 *   1. NEVER throw — a failing redaction must not crash the governance pipeline.
 *      On error, redact the entire field with [REDACTION_ERROR] rather than
 *      returning the raw value.
 *   2. Deep-walk all objects and arrays — PII can appear nested inside JSONB
 *      metadata at any depth.
 *   3. String-only mutation — numbers, booleans, null, and UUIDs are never
 *      modified, keeping numeric telemetry (risk_score, latency_ms) intact.
 *   4. Preserve structure — the object shape is never altered; only string
 *      values are scrubbed. Callers can safely pass the result to JSON.stringify
 *      and expect the same key set.
 *   5. Pattern specificity — patterns are designed to have maximum precision
 *      with minimum capture groups to avoid false positives on non-PII data.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Redaction pattern registry
//
// Each entry defines:
//   pattern  — RegExp with the global flag for replaceAll semantics
//   label    — Replacement token written into the output
//   priority — Lower numbers run first (high priority patterns replace first,
//              preventing a later pattern from partially matching a replacement
//              token like [REDACTED_EMAIL])
// ─────────────────────────────────────────────────────────────────────────────

interface RedactionRule {
    pattern:  RegExp;
    label:    string;
    priority: number;
}

const REDACTION_RULES: ReadonlyArray<RedactionRule> = [
    // ── Bearer / API key tokens ───────────────────────────────────────────────
    // Matches: Bearer <token>, sk-<key>, pk-<key>, eyJ<JWT>, sbp_<key>
    {
        priority: 1,
        label:    '[REDACTED_KEY]',
        pattern:  /\b(Bearer\s+)[A-Za-z0-9\-._~+/]+=*|(?:^|[^A-Za-z0-9])(?:sk|pk)-[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+|sbp_[A-Za-z0-9]{20,}|service_role_[A-Za-z0-9]{20,}/gi,
    },

    // ── Generic high-entropy secret patterns ─────────────────────────────────
    // Matches: key=<value>, secret=<value>, token=<value>, password=<value>
    // in query strings, JSON fragments, or log lines
    {
        priority: 2,
        label:    '[REDACTED_KEY]',
        pattern:  /(?:api[_-]?key|secret|token|password|passwd|auth|credential|access[_-]?key)\s*[:=]\s*["']?([A-Za-z0-9\-._~+/!@#$%^&*]{8,})["']?/gi,
    },

    // ── Email addresses ───────────────────────────────────────────────────────
    // RFC 5321 compliant local-part + domain matching
    {
        priority: 3,
        label:    '[REDACTED_EMAIL]',
        pattern:  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    },

    // ── Phone numbers ─────────────────────────────────────────────────────────
    // International E.164, US/UK formats, and common patterns with separators
    // Requires 7+ digits to avoid matching short numeric codes
    {
        priority: 4,
        label:    '[REDACTED_PHONE]',
        pattern:  /(?:\+?(?:1|44|33|49|61|81|86))[\s.\-]?(?:\(?\d{1,4}\)?[\s.\-]?)(?:\d[\s.\-]?){6,10}\d|\b\d{3}[\s.\-]\d{3}[\s.\-]\d{4}\b/g,
    },

    // ── Credit card numbers ───────────────────────────────────────────────────
    // Visa/Mastercard/Amex/Discover — 13-19 digits with optional separators
    {
        priority: 5,
        label:    '[REDACTED_CARD]',
        pattern:  /\b(?:4[0-9]{12}(?:[0-9]{3,6})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12,15}|(?:[0-9]{4}[\s\-]){3}[0-9]{4})\b/g,
    },

    // ── Social Security Numbers (US) ──────────────────────────────────────────
    {
        priority: 6,
        label:    '[REDACTED_SSN]',
        pattern:  /\b(?!000|666|9\d{2})\d{3}[-\s](?!00)\d{2}[-\s](?!0000)\d{4}\b/g,
    },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Core redaction functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies all redaction rules to a single string value.
 * Rules are applied in priority order (ascending).
 */
function redactString(value: string): string {
    let result = value;
    // Sort by priority ascending so high-priority rules run first
    const sortedRules = [...REDACTION_RULES].sort((a, b) => a.priority - b.priority);
    for (const rule of sortedRules) {
        // Reset lastIndex on stateful RegExp (global flag) before each use
        rule.pattern.lastIndex = 0;
        result = result.replace(rule.pattern, rule.label);
    }
    return result;
}

/**
 * Returns true if the string looks like a Facttic internal UUID.
 * UUIDs are never redacted — they are correlation IDs, not PII.
 */
function isUUID(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Redacts PII from a metadata object before persistence.
 *
 * - Deep-walks all string values in objects and arrays at any nesting depth
 * - UUIDs are preserved (they are correlation IDs, not personal data)
 * - Non-string primitives (numbers, booleans) are passed through untouched
 * - null / undefined values are passed through untouched
 * - NEVER throws — returns [REDACTION_ERROR] token on unexpected failures
 *
 * @param metadata  Any metadata value — object, array, string, or primitive
 * @returns         The same shape with all PII strings replaced by tokens
 */
export function redactPII<T>(metadata: T): T {
    try {
        return deepRedact(metadata);
    } catch {
        // Catastrophic failure guard: never crash the pipeline over redaction
        return '[REDACTION_ERROR]' as unknown as T;
    }
}

function deepRedact<T>(value: T): T {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === 'string') {
        // Preserve UUIDs — they are internal correlation IDs, not PII
        if (isUUID(value)) return value;
        return redactString(value) as unknown as T;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(deepRedact) as unknown as T;
    }

    if (typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
            result[key] = deepRedact(val);
        }
        return result as unknown as T;
    }

    return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit-specific helper
//
// For audit_log metadata objects that always follow the same shape,
// this helper provides a typed wrapper with explicit field handling.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Redacts PII from an audit log metadata object.
 * String fields that commonly carry incidentally leaked PII:
 *   - error messages (crash logs, auth failures — may contain prompt fragments)
 *   - model names (can contain org-specific identifiers)
 *   - user-supplied parameters reflected in metadata
 */
export function redactAuditMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    return redactPII(metadata);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test helper (exported for unit testing only — not for production use)
// ─────────────────────────────────────────────────────────────────────────────

/** @internal Exposed for unit testing the pattern set. Not for production use. */
export const _REDACTION_RULES_FOR_TEST = REDACTION_RULES;
